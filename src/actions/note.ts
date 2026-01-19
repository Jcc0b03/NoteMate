"use server";

import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
