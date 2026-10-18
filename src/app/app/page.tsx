import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, CreditCard, FileText, Loader2, Plus } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
    const user = await currentUser();

    const notes = await prisma.note.findMany({
        where: { userId: user?.id },
        include: {
            subject: true,
            flashcardDecks: true,
        },
        orderBy: { createdAt: "desc" },
    });

    const completedCount = notes.filter((note) => note.status === "COMPLETED").length;
    const processingCount = notes.filter((note) => note.status === "PROCESSING").length;
    const failedCount = notes.filter((note) => note.status === "FAILED").length;
    const flashcardDecksCount = notes.reduce((sum, note) => sum + note.flashcardDecks.length, 0);
    const completedPercent = notes.length > 0 ? Math.round((completedCount / notes.length) * 100) : 0;
    const recentNotes = notes.slice(0, 4);
    const readyForStudy = notes
        .filter((note) => note.status === "COMPLETED")
        .slice(0, 3);

    return (
        <div className="space-y-8">
            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-sky-600">Dashboard</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-50 md:text-4xl">
                            Cześć, {user?.firstName || "Studencie"}
                        </h1>
                        <p className="mt-2 max-w-2xl text-muted-foreground">
                            Szybki przegląd biblioteki, przetwarzania AI i materiałów gotowych do powtórki.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/app/new">
                            <Button className="bg-sky-600 text-white hover:bg-sky-700">
                                <Plus className="mr-2 size-4" />
                                Nowa notatka
                            </Button>
                        </Link>
                        <Link href="/app/plan">
                            <Button variant="outline">
                                <BookOpenCheck className="mr-2 size-4" />
                                Plan nauki
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Notatki</span>
                        <FileText className="size-5 text-sky-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{notes.length}</p>
                    <p className="mt-1 text-sm text-muted-foreground">W całej bibliotece</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Przetworzone</span>
                        <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{completedPercent}%</p>
                    <Progress value={completedPercent} className="mt-3 h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">W toku</span>
                        <Loader2 className="size-5 text-amber-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{processingCount}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{failedCount > 0 ? `${failedCount} wymaga ponowienia` : "AI działa w tle"}</p>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-card">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Zestawy fiszek</span>
                        <CreditCard className="size-5 text-violet-600" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{flashcardDecksCount}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Gotowe do nauki</p>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Ostatnia aktywność</h2>
                            <p className="text-sm text-muted-foreground">Najnowsze notatki w bibliotece.</p>
                        </div>
                        <Link href="/app/notes" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                            Wszystkie
                        </Link>
                    </div>

                    {recentNotes.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            Nie masz jeszcze notatek.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentNotes.map((note) => (
                                <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">{note.title || "Bez tytułu"}</p>
                                        <p className="mt-1 truncate text-sm text-muted-foreground">
                                            {note.subject?.name || note.tags[0] || "Bez przedmiotu"} • {new Date(note.createdAt).toLocaleDateString("pl-PL")}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                        {note.status === "COMPLETED" ? "Gotowe" : note.status === "PROCESSING" ? "AI pracuje" : "Błąd"}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-card">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <Clock3 className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Dzisiaj do nauki</h2>
                            <p className="text-sm text-muted-foreground">{readyForStudy.length} propozycje</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {readyForStudy.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                Gdy AI przetworzy notatki, pojawią się tu sugestie do powtórki.
                            </p>
                        ) : (
                            readyForStudy.map((note) => (
                                <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">{note.title || "Bez tytułu"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {note.flashcardDecks.length > 0 ? `${note.flashcardDecks.length} zest. fiszek` : "Wygeneruj fiszki"}
                                        </p>
                                    </div>
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
