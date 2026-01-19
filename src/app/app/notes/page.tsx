import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { NoteCard } from "@/components/NoteCard";
import { Button } from "@/components/ui/button";
import { getAllNotes } from "@/app/actions";
import { formatRelativeTime, getColorForSubject } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function NotesPage(props: { searchParams: Promise<{ q?: string; subject?: string }> }) {
    const searchParams = await props.searchParams;
    const query = searchParams.q || "";
    const subject = searchParams.subject || "";

    const notes = await getAllNotes(query, subject);

    async function searchAction(formData: FormData) {
        "use server";
        const q = formData.get("q");
        redirect(`/app/notes?q=${q}`);
    }

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
                        Twoje Notatki
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Przeglądaj i zarządzaj wszystkimi swoimi materiałami.
                    </p>
                </div>
                <Link href="/app/new">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 px-6 gap-2 shadow-lg shadow-blue-500/20">
                        <Plus className="size-4" />
                        Nowa notatka
                    </Button>
                </Link>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <form action={searchAction} className="relative flex-1 max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                        name="q"
                        defaultValue={query}
                        type="text"
                        placeholder="Szukaj w notatkach..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-card border border-border shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                </form>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    <Link href="/app/notes">
                        <Button variant={!subject ? "default" : "outline"} className={`rounded-xl px-6 h-12 font-medium ${!subject ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white hover:bg-muted border-border text-muted-foreground'}`}>
                            Wszystkie
                        </Button>
                    </Link>
                    {/* Ideally these would be dynamic too, but keeping static for now matching dashboard style or I could fetch subjects */}
                    <Link href="/app/notes?subject=Matematyka">
                        <Button variant={subject === 'Matematyka' ? "default" : "outline"} className={`rounded-xl px-6 h-12 font-medium ${subject === 'Matematyka' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white hover:bg-muted border-border text-muted-foreground'}`}>
                            Matematyka
                        </Button>
                    </Link>
                    <Link href="/app/notes?subject=Historia">
                        <Button variant={subject === 'Historia' ? "default" : "outline"} className={`rounded-xl px-6 h-12 font-medium ${subject === 'Historia' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white hover:bg-muted border-border text-muted-foreground'}`}>
                            Historia
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Notes Grid */}
            {notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {notes.map((note) => (
                        <Link href={`/app/notes/${note.id}`} key={note.id} className="h-full">
                            <NoteCard
                                title={note.title || "Bez tytułu"}
                                preview={note.summary || note.content?.substring(0, 100) || "Brak treści"}
                                date={formatRelativeTime(note.createdAt)}
                                tag={note.subject?.name || "Ogólne"}
                                color={getColorForSubject(note.subject?.name || null)}
                            />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-muted/30 p-6 rounded-full mb-4">
                        <Search className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-950 dark:text-blue-50">Brak wyników</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        Nie znaleźliśmy żadnych notatek pasujących do Twoich kryteriów. Spróbuj zmienić zapytanie lub dodaj nową notatkę.
                    </p>
                </div>
            )}
        </div>
    );
}
