"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NewNoteCard } from "@/components/NewNoteCard";
import { NoteCard } from "@/components/NoteCard";

type NoteStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface DashboardNote {
    id: string;
    title: string;
    preview: string;
    date: string;
    tag: string;
    color: string;
    status: NoteStatus;
    tags: string[];
    subjectName?: string | null;
    imageUrl?: string | null;
}

interface DashboardNotesProps {
    notes: DashboardNote[];
    /** Section heading. Defaults to "Ostatnie Notatki". */
    heading?: string;
    /** When set, shows a "Zobacz wszystkie" link instead of the visible/total counter. */
    viewAllHref?: string;
    /** When set, limits how many cards are shown while no search/filter is active. */
    limit?: number;
    /** Whether to render the "add note" card at the end. Defaults to true. */
    showNewCard?: boolean;
}

export function DashboardNotes({ notes, heading = "Ostatnie Notatki", viewAllHref, limit, showNewCard = true }: DashboardNotesProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [activeSubject, setActiveSubject] = useState("all");

    // Keep the dashboard fresh while any note is still being processed by the AI,
    // so cards flip from "Przetwarzanie" to "Gotowe" without a manual refresh.
    useEffect(() => {
        const hasProcessing = notes.some((note) => note.status === "PROCESSING");
        if (!hasProcessing) return;

        const interval = setInterval(() => router.refresh(), 5000);
        return () => clearInterval(interval);
    }, [notes, router]);

    const subjects = useMemo(() => {
        const uniqueSubjects = new Set(notes.map((note) => note.subjectName || note.tag).filter(Boolean));
        return Array.from(uniqueSubjects).sort((a, b) => a.localeCompare(b, "pl"));
    }, [notes]);

    const filteredNotes = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return notes.filter((note) => {
            const matchesSubject = activeSubject === "all" || (note.subjectName || note.tag) === activeSubject;
            const searchableText = [
                note.title,
                note.preview,
                note.tag,
                note.subjectName || "",
                ...note.tags,
            ].join(" ").toLowerCase();

            return matchesSubject && (!normalizedQuery || searchableText.includes(normalizedQuery));
        });
    }, [activeSubject, notes, query]);

    const isFiltering = query.trim() !== "" || activeSubject !== "all";
    const visibleNotes = limit && !isFiltering ? filteredNotes.slice(0, limit) : filteredNotes;
    const hiddenCount = filteredNotes.length - visibleNotes.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Szukaj w notatkach..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-card border border-border shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    <Button
                        onClick={() => setActiveSubject("all")}
                        className="rounded-xl px-6 h-12 font-medium"
                        variant={activeSubject === "all" ? "default" : "outline"}
                    >
                        Wszystkie
                    </Button>
                    {subjects.map((subject) => (
                        <Button
                            key={subject}
                            onClick={() => setActiveSubject(subject)}
                            variant={activeSubject === subject ? "default" : "outline"}
                            className="rounded-xl px-6 h-12 bg-white hover:bg-muted font-medium border-border text-muted-foreground data-[active=true]:bg-blue-500 data-[active=true]:text-white data-[active=true]:border-blue-500"
                            data-active={activeSubject === subject}
                        >
                            {subject}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">{heading}</h2>
                    {viewAllHref ? (
                        <Link href={viewAllHref} className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                            Zobacz wszystkie
                            <ChevronRight className="size-4" />
                        </Link>
                    ) : (
                        <span className="text-sm font-semibold text-blue-500 flex items-center gap-1">
                            {filteredNotes.length} / {notes.length}
                        </span>
                    )}
                </div>

                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
                        <FileText className="size-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground">Nie masz jeszcze żadnych notatek.</p>
                        <Link href="/app/new">
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">Dodaj pierwszą notatkę</Button>
                        </Link>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center text-muted-foreground">
                        Brak notatek pasujących do wyszukiwania.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {visibleNotes.map((note) => (
                            <Link href={`/notes/${note.id}`} key={note.id}>
                                <NoteCard
                                    id={note.id}
                                    title={note.title}
                                    preview={note.preview}
                                    date={note.date}
                                    tag={note.tag}
                                    color={note.color}
                                    status={note.status}
                                    tags={note.tags}
                                    subjectName={note.subjectName || undefined}
                                    imageUrl={note.imageUrl}
                                />
                            </Link>
                        ))}
                        {showNewCard && (
                            <Link href="/app/new" className="h-full">
                                <NewNoteCard />
                            </Link>
                        )}
                    </div>
                )}

                {viewAllHref && hiddenCount > 0 && (
                    <div className="flex justify-center">
                        <Link href={viewAllHref} className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                            Zobacz wszystkie ({notes.length})
                            <ChevronRight className="size-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
