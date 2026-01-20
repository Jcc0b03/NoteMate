"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleNoteShare(noteId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const note = await prisma.note.findUnique({
        where: { id: noteId, userId: user.id },
    });

    if (!note) return { success: false, error: "Note not found" };

    const newIsShared = !note.isShared;
    let shareToken = note.shareToken;

    if (newIsShared && !shareToken) {
        shareToken = crypto.randomUUID();
    }

    await prisma.note.update({
        where: { id: noteId },
        data: {
            isShared: newIsShared,
            shareToken: shareToken,
        },
    });

    revalidatePath(`/notes/${noteId}`);
    return { success: true, isShared: newIsShared, shareToken, isPublicEditable: note.isPublicEditable };
}

export async function setPublicEditable(noteId: string, isEditable: boolean) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.note.update({
        where: { id: noteId, userId: user.id },
        data: { isPublicEditable: isEditable },
    });

    revalidatePath(`/notes/${noteId}`);
    return { success: true };
}

export async function revokeNoteShare(noteId: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const note = await prisma.note.findUnique({
        where: { id: noteId, userId: user.id },
    });

    if (!note) return { success: false, error: "Note not found" };

    await prisma.note.update({
        where: { id: noteId },
        data: {
            isShared: false,
            shareToken: null
        },
    });

    revalidatePath(`/notes/${noteId}`);
    return { success: true };
}
