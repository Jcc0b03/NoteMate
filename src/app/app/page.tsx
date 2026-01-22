import Link from "next/link";
import { Search, Flame, CheckCircle2, Play, ChevronRight } from "lucide-react";
import { NoteCard } from "@/components/NoteCard";
import { NewNoteCard } from "@/components/NewNoteCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
    const user = await currentUser();

    const notes = await prisma.note.findMany({
        where: {
            userId: user?.id,
        },
        include: {
            subject: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return (
        <div className="space-y-10">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
                        Cześć, {user?.firstName || "Alex"}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Masz dzisiaj 3 notatki do powtórzenia.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-card px-5 py-3 rounded-2xl shadow-sm border border-border flex items-center gap-4 min-w-[160px]">
                        <div className="size-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <Flame className="size-5 fill-orange-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Dni z rzędu</span>
                            <span className="text-xl font-bold text-blue-950 dark:text-blue-50">12</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card px-5 py-3 rounded-2xl shadow-sm border border-border flex items-center gap-4 min-w-[160px]">
                        <div className="size-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ukończone</span>
                            <span className="text-xl font-bold text-blue-950 dark:text-blue-50">85%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Szukaj w notatkach..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-card border border-border shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    <Button className="rounded-xl px-6 h-12 bg-blue-500 hover:bg-blue-600 font-medium">Wszystkie</Button>
                    <Button variant="outline" className="rounded-xl px-6 h-12 bg-white hover:bg-muted font-medium border-border text-muted-foreground">Matematyka</Button>
                    <Button variant="outline" className="rounded-xl px-6 h-12 bg-white hover:bg-muted font-medium border-border text-muted-foreground">Historia</Button>
                    <Button variant="outline" className="rounded-xl px-6 h-12 bg-white hover:bg-muted font-medium border-border text-muted-foreground">Fizyka</Button>
                </div>
            </div>

            {/* Recent Notes */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Ostatnie Notatki</h2>
                    <Link href="/app/notes" className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        Zobacz wszystkie <ChevronRight className="size-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {notes.map((note: any) => {
                        const subjectName = note.subject?.name || (note.tags.length > 0 ? note.tags[0] : "Inne");
                        const colorMap: Record<string, string> = {
                            "matematyka": "blue",
                            "fizyka": "green",
                            "historia": "orange",
                            "biologia": "purple"
                        };
                        const color = colorMap[subjectName.toLowerCase()] || "blue";

                        return (
                            <Link href={`/notes/${note.id}`} key={note.id}>
                                <NoteCard
                                    id={note.id}
                                    title={note.title || "Bez tytułu"}
                                    preview={note.summary || note.content || "Oczekiwanie na przetworzenie przez AI..."}
                                    date={new Date(note.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
                                    tag={subjectName}
                                    color={color}
                                    status={note.status}
                                    tags={note.tags}
                                    subjectName={note.subject?.name}
                                />
                            </Link>
                        );
                    })}
                    <Link href="/app/new" className="h-full">
                        <NewNoteCard />
                    </Link>
                </div>
            </div>

            {/* Study Plan Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Plan Powtórek</h2>

                <div className="bg-white dark:bg-card rounded-3xl p-8 shadow-sm border border-border grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    {/* Progress */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Postęp Dzienny
                            </div>
                            <span className="font-bold text-blue-600">70%</span>
                        </div>
                        <Progress value={70} className="h-3 bg-blue-100 [&>div]:bg-blue-500 rounded-full" />
                        <p className="text-sm text-muted-foreground font-medium">
                            Jeszcze 15 minut nauki, aby osiągnąć cel!
                        </p>
                    </div>

                    {/* Task 1 */}
                    <div className="bg-gray-50 dark:bg-muted/30 rounded-2xl p-4 flex items-center gap-4 border border-border/50">
                        <div className="size-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-blue-950 dark:text-blue-50">Review: Gramatyka Angielska</h4>
                            <p className="text-xs text-muted-foreground">5 kart • Wysoki priorytet</p>
                        </div>
                    </div>

                    {/* Task 2 */}
                    <div className="bg-gray-50 dark:bg-muted/30 rounded-2xl p-4 flex items-center gap-4 border border-border/50">
                        <div className="size-12 rounded-xl bg-white flex items-center justify-center text-blue-950 shrink-0 shadow-sm border border-border/50">
                            <Play className="size-5 ml-0.5 fill-blue-950" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-blue-950 dark:text-blue-50">Quiz: Daty Historyczne</h4>
                            <p className="text-xs text-muted-foreground">10 pytań • Średni priorytet</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-muted-foreground">
                <p>© 2023 Notemate. Wszelkie prawa zastrzeżone.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="#" className="hover:text-foreground">Prywatność</a>
                    <a href="#" className="hover:text-foreground">Regulamin</a>
                    <a href="#" className="hover:text-foreground">Pomoc</a>
                </div>
            </footer>
        </div>
    );
}
