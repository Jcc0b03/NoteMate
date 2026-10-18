"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { processNoteWithAi } from "@/lib/note-ai";
import { claimUploads } from "@/lib/uploads";
import { copyPrivateFile, cleanupStoredFile } from "@/lib/file-storage";
import { deleteCachedAiFile } from "@/lib/ai-files";

function scheduleNoteProcessing(noteId: string) {
    after(async () => {
        await processNoteWithAi(noteId).catch((error) => {
            console.error("Background note processing failed:", error);
        });
    });
}

export async function createNote(data: {
    title: string;
    subjectName: string;
    tags: string[];
    files: { url: string; name: string; type: string; size: number }[];
}) {
    const user = await currentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { title, subjectName, tags, files } = data;

    const note = await prisma.$transaction(async tx => {
        const uploads = await claimUploads(tx, files.map(file => file.url), user.id);
        const subject = subjectName ? await tx.subject.upsert({
            where: {
                userId_name: {
                    userId: user.id,
                    name: subjectName,
                },
            },
            update: {},
            create: {
                userId: user.id,
                name: subjectName,
            },
        }) : null;

        // 2. Create Note
        return tx.note.create({
            data: {
                userId: user.id,
                title: title || "Nowa notatka",
                subjectId: subject?.id,
                tags,
                sharedWith: [],
                imageUrl: uploads[0]?.type.startsWith("image/") ? uploads[0].url : undefined,
                status: "PROCESSING",
                // Create NoteFiles
                files: {
                    create: uploads.map((f) => ({
                        url: f.url,
                        name: f.name,
                        sourceName: f.name,
                        type: f.type,
                        size: f.size,
                    })),
                },
            },
        });
    });

    revalidatePath("/app");
    scheduleNoteProcessing(note.id);
    return { success: true, noteId: note.id };
}

export async function updateNoteTitle(noteId: string, newTitle: string) {
    const user = await currentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.note.update({
            where: {
                id: noteId,
                userId: user.id, // Ensure ownership
            },
            data: {
                title: newTitle,
            },
        });

        revalidatePath(`/notes/${noteId}`);
        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Error updating note title:", error);
        return { success: false, error: "Failed to update title" };
    }
}

export async function deleteNote(noteId: string) {
    const user = await currentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const deletion = await prisma.$transaction(async tx => {
            const note = await tx.note.findUnique({
                where: {
                    id: noteId,
                    userId: user.id,
                },
                include: {
                    files: true,
                },
            });

            if (!note) return null;

            // Delete note from database (Cascades to NoteFile)
            await tx.note.delete({
                where: {
                    id: noteId,
                    userId: user.id,
                },
            });
            const orphanUrls: string[] = [];
            for (const url of new Set(note.files.map(file => file.url))) {
                // Older clones may still share a blob. Keep it until the last reference is gone.
                if (await tx.noteFile.count({ where: { url } }) === 0) {
                    await tx.upload.deleteMany({ where: { url } });
                    await tx.blobDeletion.upsert({ where: { url }, update: {}, create: { url } });
                    orphanUrls.push(url);
                }
            }
            return { orphanUrls, googleNames: note.files.flatMap(file => file.aiFileName ? [file.aiFileName] : []) };
        });
        if (!deletion) return { success: false, error: "Note not found" };
        // A storage outage must not destroy files still referenced by another note.
        const cleaned = await Promise.all(deletion.orphanUrls.map(cleanupStoredFile));
        await Promise.all(deletion.googleNames.map(deleteCachedAiFile));

        revalidatePath("/app");
        return { success: true, cleanupPending: cleaned.some(result => !result) };
    } catch (error) {
        console.error("Error deleting note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

export async function cloneNote(noteId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const copies: Awaited<ReturnType<typeof copyPrivateFile>>[] = [];
    try {
        const sourceNote = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                files: true,
                subject: true,
            },
        });

        if (!sourceNote) return { success: false, error: "Note not found" };

        // Ensure user has access (is owner or note is shared)
        const hasAccess = sourceNote.userId === user.id || sourceNote.isShared || sourceNote.sharedWith.includes(user.id);
        if (!hasAccess) return { success: false, error: "Unauthorized" };

        // Each clone owns independent private objects, not the source URLs.
        for (const file of sourceNote.files) {
            copies.push(await copyPrivateFile(file, user.id));
        }

        const newNote = await prisma.$transaction(async tx => {
            let subjectId: string | undefined;

            // If subject exists, try to find matching subject for current user or create new
            if (sourceNote.subject) {
                const userSubject = await tx.subject.upsert({
                    where: {
                        userId_name: {
                            userId: user.id,
                            name: sourceNote.subject.name,
                        },
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        name: sourceNote.subject.name,
                    },
                });
                subjectId = userSubject.id;
            }

            await tx.upload.createMany({ data: copies.map(file => ({ ...file, userId: user.id, claimedAt: new Date() })) });
            return tx.note.create({
                data: {
                    userId: user.id,
                    title: `${sourceNote.title} (Kopia)`,
                    subjectId: subjectId,
                    tags: sourceNote.tags,
                    content: sourceNote.content,
                    summary: sourceNote.summary,
                    imageUrl: copies.find(file => file.type.startsWith("image/"))?.url,
                    status: sourceNote.status,
                    files: {
                        create: copies.map((f, index) => ({
                            url: f.url,
                            name: f.name,
                            type: f.type,
                            size: f.size,
                            sourceName: sourceNote.files[index].sourceName
                        }))
                    }
                },
            });
        });

        // Cache invalidation must not roll back or delete already committed copies.
        try {
            revalidatePath("/app");
        } catch (error) {
            console.error("Clone cache invalidation failed:", error);
        }
        return { success: true, noteId: newNote.id };
    } catch (error) {
        await Promise.all(copies.map(file => del(file.url).catch(() => console.error("Clone cleanup failed"))));
        console.error("Clone error:", error);
        return { success: false, error: "Failed to clone note" };
    }
}

export async function updateNoteDetails(noteId: string, data: {
    title: string;
    subjectName: string;
    tags: string[];
}) {
    const user = await currentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { title, subjectName, tags } = data;

    // 1. Find or create Subject
    let subjectId: string | undefined;

    if (subjectName) {
        const subject = await prisma.subject.upsert({
            where: {
                userId_name: {
                    userId: user.id,
                    name: subjectName,
                },
            },
            update: {},
            create: {
                userId: user.id,
                name: subjectName,
            },
        });
        subjectId = subject.id;
    }

    try {
        await prisma.note.update({
            where: {
                id: noteId,
                userId: user.id,
            },
            data: {
                title,
                subjectId,
                tags,
            },
        });

        revalidatePath(`/notes/${noteId}`);
        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Error updating note details:", error);
        return { success: false, error: "Failed to update note details" };
    }
}

export async function addNoteFiles(noteId: string, files: { url: string; name: string; type: string; size: number }[]) {
    const user = await currentUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.$transaction(async tx => {
            const note = await tx.note.findUnique({
                where: { id: noteId },
                select: { userId: true, isShared: true, isPublicEditable: true }
            });

            if (!note) throw new Error("Note not found");

            const canEdit = note.userId === user.id || (note.isShared && note.isPublicEditable);

            if (!canEdit) {
                throw new Error("Unauthorized");
            }

            const uploads = await claimUploads(tx, files.map(file => file.url), user.id);
            await tx.note.update({
                where: { id: noteId },
                data: {
                    status: "PROCESSING",
                    files: {
                        create: uploads.map((f) => ({
                            url: f.url,
                            name: f.name,
                            sourceName: f.name,
                            type: f.type,
                            size: f.size,
                        })),
                    },
                },
            });
        });

        revalidatePath(`/notes/${noteId}`);
        revalidatePath("/app");
        revalidatePath("/app/notes");
        scheduleNoteProcessing(noteId);
        return { success: true };
    } catch (error) {
        console.error("Error adding files:", error);
        return { success: false, error: "Failed to add files" };
    }
}
