"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardStudyViewProps {
    title: string;
    noteTitle: string;
    cards: Flashcard[];
}

export function FlashcardStudyView({ title, noteTitle, cards }: FlashcardStudyViewProps) {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

    const currentCard = cards[index];
    const progress = useMemo(() => Math.round(((index + 1) / cards.length) * 100), [cards.length, index]);

    const goToCard = (nextIndex: number) => {
        setIndex(nextIndex);
        setIsFlipped(false);
    };

    const markKnown = () => {
        setKnownCards((prev) => {
            const next = new Set(prev);
            next.add(index);
            return next;
        });

        if (index < cards.length - 1) {
            goToCard(index + 1);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 sm:px-6">
                <header className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Wróć">
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
                        <p className="truncate text-sm text-muted-foreground">{noteTitle}</p>
                    </div>
                </header>

                <div className="mb-5 space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Fiszka {index + 1} z {cards.length}
                        </span>
                        <span>{knownCards.size} zapamiętanych</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <button
                    type="button"
                    onClick={() => setIsFlipped((value) => !value)}
                    className="flex min-h-[340px] flex-1 items-center justify-center rounded-lg border bg-card p-8 text-center shadow-sm transition-colors hover:bg-muted/30"
                >
                    <div>
                        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {isFlipped ? "Odpowiedź" : "Pytanie"}
                        </div>
                        <p className="text-2xl font-semibold leading-relaxed sm:text-3xl">
                            {isFlipped ? currentCard.back : currentCard.front}
                        </p>
                    </div>
                </button>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => goToCard(Math.max(0, index - 1))} disabled={index === 0}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setIsFlipped((value) => !value)}>
                        <RotateCcw className="mr-2 size-4" />
                        Odwróć
                    </Button>
                    <Button onClick={markKnown}>
                        {index < cards.length - 1 ? <ChevronRight className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </Button>
                </div>
            </div>
        </main>
    );
}
