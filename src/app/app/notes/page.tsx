import { currentUser } from "@clerk/nextjs/server";
import { DashboardNotes } from "@/components/DashboardNotes";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, FileText, Tags } from "lucide-react";

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

    const completedCount = notes.filter((note) => note.status === "COMPLETED").length;
    const processingCount = notes.filter((note) => note.status === "PROCESSING").length;
    const subjectsCount = new Set(notes.map((note) => note.subject?.name || note.tags[0]).filter(Boolean)).size;

    return (
        <div className="space-y-8">
            <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                <p className="text-sm font-semibold text-sky-600">Biblioteka</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-50 md:text-4xl">
                    Moje notatki
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                    Pełna lista materiałów. Tutaj najwygodniej wyszukasz, przefiltrujesz i wejdziesz w konkretne notatki.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Wszystkie notatki</span>
                        <FileText className="size-5 text-sky-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{notes.length}</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Gotowe do czytania</span>
                        <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{completedCount}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{processingCount} w przetwarzaniu</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Przedmioty i tagi</span>
                        <Tags className="size-5 text-violet-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{subjectsCount}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Aktywne kategorie</p>
                </div>
            </div>

            <DashboardNotes notes={noteItems} heading="Wszystkie Notatki" />
        </div>
    );
}
