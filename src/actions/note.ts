"use server";

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
                    type: f.type,
                    size: f.size,
                })),
            },
        },
    });

    revalidatePath("/app");
    return { success: true, noteId: note.id };
}
