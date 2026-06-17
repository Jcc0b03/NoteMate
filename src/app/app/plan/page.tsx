import Link from "next/link";
import { BookOpenCheck, CalendarClock, CheckCircle2, Clock3, CreditCard, FileText, Play, Sparkles } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "Plan Nauki | NoteMate",
};

export default async function PlanPage() {
    const user = await currentUser();

    const notes = await prisma.note.findMany({
        where: { userId: user?.id },
        include: {
            subject: true,
            flashcardDecks: {
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { updatedAt: "desc" },
    });

    const completedNotes = notes.filter((note) => note.status === "COMPLETED");
    const processingNotes = notes.filter((note) => note.status === "PROCESSING");
    const notesWithDecks = completedNotes.filter((note) => note.flashcardDecks.length > 0);
    const notesWithoutDecks = completedNotes.filter((note) => note.flashcardDecks.length === 0);
    const totalDecks = notes.reduce((sum, note) => sum + note.flashcardDecks.length, 0);
    const dailyTarget = Math.max(3, Math.min(8, completedNotes.length || 3));
    const todayCount = Math.min(notesWithDecks.length + notesWithoutDecks.length, dailyTarget);
    const dailyProgress = Math.round((todayCount / dailyTarget) * 100);

    const flashcardTasks = notesWithDecks.slice(0, 4);
    const creationTasks = notesWithoutDecks.slice(0, 3);

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-emerald-600">Plan nauki</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-50 md:text-4xl">
                            Dzisiejsze powtórki
                        </h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">
                            Oddzielny widok do pracy z materiałami: powtarzaj fiszki, uzupełniaj brakujące zestawy i sprawdzaj, co AI jeszcze przetwarza.
                        </p>
                    </div>
                    <Link href="/app/notes">
                        <Button variant="outline">
                            <FileText className="mr-2 size-4" />
                            Przejdź do notatek
                        </Button>
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Cel dzienny</span>
                        <CalendarClock className="size-5 text-emerald-600" />
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                        <span className="text-3xl font-bold">{todayCount}</span>
                        <span className="pb-1 text-sm text-muted-foreground">/ {dailyTarget} zadań</span>
                    </div>
                    <Progress value={dailyProgress} className="mt-3 h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Zestawy fiszek</span>
                        <CreditCard className="size-5 text-sky-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{totalDecks}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{notesWithDecks.length} notatek ma fiszki</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Czeka na AI</span>
                        <Clock3 className="size-5 text-amber-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{processingNotes.length}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Materiał pojawi się po analizie</p>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Powtórki z fiszek</h2>
                            <p className="text-sm text-muted-foreground">Najlepsze zadania na teraz, jeśli zestawy już istnieją.</p>
                        </div>
                        <BookOpenCheck className="size-6 text-emerald-600" />
                    </div>

                    {flashcardTasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <CreditCard className="mx-auto mb-3 size-9 text-muted-foreground/50" />
                            <h3 className="font-semibold">Nie ma jeszcze fiszek do powtórki</h3>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                                Wejdź w notatkę i wygeneruj pierwszy zestaw fiszek, a pojawi się tutaj jako zadanie.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {flashcardTasks.map((note) => {
                                const latestDeck = note.flashcardDecks[0];
                                return (
                                    <div key={note.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{note.title || "Bez tytułu"}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {note.subject?.name || note.tags[0] || "Bez przedmiotu"} • {note.flashcardDecks.length} zest. fiszek
                                            </p>
                                        </div>
                                        <Link href={`/flashcards/${latestDeck.token}`}>
                                            <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
                                                <Play className="mr-2 size-4" />
                                                Ucz się
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Utwórz fiszki</h2>
                                <p className="text-sm text-muted-foreground">Gotowe notatki bez zestawów.</p>
                            </div>
                            <Sparkles className="size-6 text-sky-600" />
                        </div>
                        <div className="space-y-3">
                            {creationTasks.length === 0 ? (
                                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    Wszystkie gotowe notatki mają już zestawy fiszek albo czekają na przetworzenie.
                                </p>
                            ) : (
                                creationTasks.map((note) => (
                                    <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">{note.title || "Bez tytułu"}</p>
                                            <p className="text-xs text-muted-foreground">Zakładka Fiszki</p>
                                        </div>
                                        <Sparkles className="size-4 shrink-0 text-sky-600" />
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Status AI</h2>
                                <p className="text-sm text-muted-foreground">Materiały w kolejce.</p>
                            </div>
                            <CheckCircle2 className="size-6 text-emerald-600" />
                        </div>
                        {processingNotes.length === 0 ? (
                            <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                                Wszystkie bieżące notatki są przetworzone.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {processingNotes.slice(0, 4).map((note) => (
                                    <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-lg border p-4 hover:bg-muted/30">
                                        <p className="truncate text-sm font-semibold">{note.title || "Bez tytułu"}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">AI analizuje pliki</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
