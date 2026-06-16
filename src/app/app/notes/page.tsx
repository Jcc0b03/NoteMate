import { currentUser } from "@clerk/nextjs/server";
import { DashboardNotes } from "@/components/DashboardNotes";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Moje Notatki | NoteMate",
};

export default async function MyNotesPage() {
    const user = await currentUser();

    const notes = await prisma.note.findMany({
        where: {
            userId: user?.id,
        },
        include: {
            subject: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const noteItems = notes.map((note) => {
        const subjectName = note.subject?.name || (note.tags.length > 0 ? note.tags[0] : "Inne");
        const colorMap: Record<string, string> = {
            matematyka: "blue",
            fizyka: "green",
            historia: "orange",
            biologia: "purple",
        };
        const color = colorMap[subjectName.toLowerCase()] || "blue";

        return {
            id: note.id,
            title: note.title || "Bez tytułu",
            preview: note.summary || note.content || "Oczekiwanie na przetworzenie przez AI...",
            date: new Date(note.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short" }),
            tag: subjectName,
            color,
            status: note.status,
            tags: note.tags,
            subjectName: note.subject?.name,
            imageUrl: note.imageUrl,
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
                    Moje Notatki
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Wszystkie Twoje notatki w jednym miejscu. Wyszukuj i filtruj po przedmiocie.
                </p>
            </div>

            <DashboardNotes notes={noteItems} heading="Wszystkie Notatki" />
        </div>
    );
}
