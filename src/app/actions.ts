'use server'

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NoteStatus } from "@prisma/client";

export async function getRecentNotes() {
    const user = await currentUser();
    if (!user) return [];

    return await prisma.note.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 3,
        include: {
            subject: true,
        },
    });
}

import { Prisma } from "@prisma/client";

export async function getAllNotes(query?: string, subject?: string) {
    const user = await currentUser();
    if (!user) return [];

    const where: Prisma.NoteWhereInput = {
        userId: user.id,
    };

    if (query) {
        where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
        ];
    }

    if (subject) {
        where.subject = {
            name: subject,
        };
    }

    return await prisma.note.findMany({
        where,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            subject: true,
        },
    });
}

export async function getNote(id: string) {
    const user = await currentUser();
    if (!user) return null;

    const note = await prisma.note.findUnique({
        where: { id },
        include: {
            subject: true,
            files: true,
            messages: {
                orderBy: {
                    createdAt: 'asc',
                },
            },
        },
    });

    if (!note || (note.userId !== user.id && !note.sharedWith.includes(user.id))) {
        return null;
    }

    return note;
}

export async function getSubjects() {
    const user = await currentUser();
    if (!user) return [];

    return await prisma.subject.findMany({
        where: {
            userId: user.id,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createSubject(name: string) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const subject = await prisma.subject.create({
        data: {
            name,
            userId: user.id,
        },
    });

    revalidatePath('/app/new');
    return subject;
}

export async function createNote(formData: FormData) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const subjectName = formData.get("subject") as string;
    const tagsString = formData.get("tags") as string; // JSON string or comma separated
    const tags = tagsString ? JSON.parse(tagsString) : [];

    const filesString = formData.get("files") as string;
    const files = filesString ? JSON.parse(filesString) : [];

    // Handle subject: find or create
    let subjectId = null;
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
                name: subjectName,
                userId: user.id,
            },
        });
        subjectId = subject.id;
    }

    // Handle files (Mocking for now as we don't have Blob setup in this environment)
    // In a real app, we would upload to Blob here or get URLs from client upload
    // Assuming client sends file metadata or URLs if uploaded client-side.
    // For this "design views" task, let's assume we create a note record.

    // If files were uploaded client side, we would expect URLs.
    // If server side upload is needed, we would process `formData.getAll('files')`.
    // Let's assume for MVP we just create the note entry.

    const newNote = await prisma.note.create({
        data: {
            userId: user.id,
            title: title || "Nowa notatka",
            subjectId,
            tags,
            status: NoteStatus.PROCESSING, // Assume AI processing starts
            // Mock content for demo purposes if not provided
            content: "To jest przykładowa treść notatki wygenerowana automatycznie lub oczekująca na przetworzenie OCR.",
            summary: "To jest krótkie podsumowanie notatki.",
            files: {
                create: files.map((f: { name: string; size: number; type?: string }) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type || "application/octet-stream",
                    url: `https://placehold.co/600x400?text=${encodeURIComponent(f.name)}`, // Placeholder
                }))
            }
        },
    });

    revalidatePath('/app');
    revalidatePath('/app/notes');
    redirect(`/app/notes/${newNote.id}`);
}

export async function getDashboardStats() {
    const user = await currentUser();
    if (!user) return { streak: 0, completedPercentage: 0 };

    // Mock stats for now, or calculate from DB
    // Streak calculation is complex without a daily tracking table, so we'll mock or infer.
    // Completed percentage could be notes processed vs total notes?

    const totalNotes = await prisma.note.count({ where: { userId: user.id } });
    const processedNotes = await prisma.note.count({
        where: {
            userId: user.id,
            status: NoteStatus.COMPLETED
        }
    });

    return {
        streak: 12, // Mocked
        completedPercentage: totalNotes > 0 ? Math.round((processedNotes / totalNotes) * 100) : 0,
    };
}
