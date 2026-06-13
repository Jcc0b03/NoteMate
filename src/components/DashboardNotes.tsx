"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
}

interface DashboardNotesProps {
    notes: DashboardNote[];
}

export function DashboardNotes({ notes }: DashboardNotesProps) {
    const [query, setQuery] = useState("");
    const [activeSubject, setActiveSubject] = useState("all");

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
                    <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">Ostatnie Notatki</h2>
                    <span className="text-sm font-semibold text-blue-500 flex items-center gap-1">
                        {filteredNotes.length} / {notes.length}
                        <ChevronRight className="size-4" />
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {filteredNotes.map((note) => (
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
                            />
                        </Link>
                    ))}
                    <Link href="/app/new" className="h-full">
                        <NewNoteCard />
                    </Link>
                </div>
            </div>
        </div>
    );
}
