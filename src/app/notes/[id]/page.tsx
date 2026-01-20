import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { NoteView } from "@/components/NoteView";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: PageProps) {
    const { id } = await params;
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    const note = await prisma.note.findUnique({
        where: { id },
        include: {
            files: true,
        },
    });

    if (!note) {
        notFound();
    }

    // Check permissions
    const isOwner = note.userId === user.id;
    const isShared = note.sharedWith.includes(user.id);
    const isPubliclyShared = note.isShared;

    if (!isOwner && !isShared && !isPubliclyShared) {
        // You might want to show a specialized 403 page
        notFound(); // Hiding existance for now
    }

    return <NoteView note={note} isOwner={isOwner} />;
}
