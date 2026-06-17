"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { processNoteWithAi } from "@/lib/note-ai";

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

    // 2. Create Note
    const note = await prisma.note.create({
        data: {
            userId: user.id,
            title: title || "Nowa notatka",
            subjectId,
            tags,
            imageUrl: files.length > 0 && files[0].type.startsWith("image") ? files[0].url : undefined,
            status: "PROCESSING",
            // Create NoteFiles
            files: {
                create: files.map((f) => ({
                    url: f.url,
                    name: f.name,
                    sourceName: f.name,
                    type: f.type,
                    size: f.size,
                })),
            },
        },
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
        const note = await prisma.note.findUnique({
            where: {
                id: noteId,
                userId: user.id,
            },
            include: {
                files: true,
            },
        });

        if (!note) {
            return { success: false, error: "Note not found" };
        }

        // Delete files from Blob Storage
        if (note.files.length > 0) {
            await Promise.all(
                note.files.map((file) => del(file.url))
            );
        }

        // Delete note from database (Cascades to NoteFile)
        await prisma.note.delete({
            where: {
                id: noteId,
            },
        });

        revalidatePath("/app");
        return { success: true };
    } catch (error) {
        console.error("Error deleting note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

export async function cloneNote(noteId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

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

        let subjectId = sourceNote.subjectId;

        // If subject exists, try to find matching subject for current user or create new
        if (sourceNote.subject) {
            const userSubject = await prisma.subject.upsert({
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

        const newNote = await prisma.note.create({
            data: {
                userId: user.id,
                title: `${sourceNote.title} (Kopia)`,
                subjectId: subjectId,
                tags: sourceNote.tags,
                content: sourceNote.content,
                summary: sourceNote.summary,
                imageUrl: sourceNote.imageUrl,
                status: sourceNote.status,
                files: {
                    create: sourceNote.files.map(f => ({
                        url: f.url,
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        sourceName: f.sourceName
                    }))
                }
            },
        });

        revalidatePath("/app");
        return { success: true, noteId: newNote.id };
    } catch (error) {
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
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            select: { userId: true, isShared: true, isPublicEditable: true }
        });

        if (!note) throw new Error("Note not found");

        const canEdit = note.userId === user.id || (note.isShared && note.isPublicEditable);

        if (!canEdit) {
            throw new Error("Unauthorized");
        }

        await prisma.note.update({
            where: { id: noteId },
            data: {
                status: "PROCESSING",
                files: {
                    create: files.map((f) => ({
                        url: f.url,
                        name: f.name,
                        sourceName: f.name,
                        type: f.type,
                        size: f.size,
                    })),
                },
            },
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
