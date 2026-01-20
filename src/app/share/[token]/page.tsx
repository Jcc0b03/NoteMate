import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { NoteView } from "@/components/NoteView";

interface SharePageProps {
    params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
    const { token } = await params;
    const note = await prisma.note.findUnique({
        where: { shareToken: token },
        select: { title: true, isShared: true, summary: true, imageUrl: true },
    });

    if (!note || !note.isShared) {
        return {
            title: "Notatka niedostępna - NoteMate",
        };
    }

    const description = note.summary
        ? note.summary.slice(0, 150) + (note.summary.length > 150 ? "..." : "")
        : "Zobacz notatkę udostępnioną w aplikacji NoteMate.";

    return {
        title: `${note.title || "Bez tytułu"} | NoteMate`,
        description: description,
        openGraph: {
            title: `${note.title || "Bez tytułu"} | NoteMate`,
            description: description,
            images: note.imageUrl ? [note.imageUrl] : ["/og-default.png"],
            type: "article",
        },
    };
}

export default async function SharePage({ params }: SharePageProps) {
    const { token } = await params;

    // 1. Fetch note
    const note = await prisma.note.findUnique({
        where: { shareToken: token },
        include: { files: true },
    });

    // 2. Validate existence and share status
    if (!note || !note.isShared) {
        notFound();
    }

    // 3. User check (Deep Linking Logic)
    const user = await currentUser();

    // 4. If logged out -> Redirect to Login with return URL
    // CRITICAL: We pass redirect_url to ensure they come back here after Sign In / Sign Up
    if (!user) {
        const currentPath = `/share/${token}`;
        redirect(`/login?redirect_url=${encodeURIComponent(currentPath)}`);
    }

    // 5. Increment View Count (Analytics)
    await prisma.note.update({
        where: { id: note.id },
        data: { viewCount: { increment: 1 } },
    });

    // 6. Access Control and Rendering
    const isOwner = user.id === note.userId;

    if (isOwner) {
        // Owners get the full editable experience
        redirect(`/notes/${note.id}`);
    } else {
        // Viewers: if isPublicEditable is true, they can edit (readOnly=false)
        // Otherwise, readOnly=true
        const canEdit = note.isPublicEditable;
        return <NoteView note={note} readOnly={!canEdit} isOwner={isOwner} />;
    }
}
