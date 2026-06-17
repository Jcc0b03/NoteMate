"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, RotateCcw, SkipForward, Sparkles } from "lucide-react";
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

    const skipCard = () => {
        if (index < cards.length - 1) {
            goToCard(index + 1);
        }
    };

    return (
        <main className="min-h-screen bg-[#eef3f8] text-slate-950">
            <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-5 sm:px-6">
                <header className="mb-6 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.history.back()}
                        aria-label="Wróć"
                        className="shrink-0 text-slate-600 hover:bg-white hover:text-slate-950"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
                        <p className="truncate text-sm text-slate-600">{noteTitle}</p>
                    </div>
                    <div className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm sm:block">
                        {knownCards.size} / {cards.length}
                    </div>
                </header>

                <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                        <span>
                            Fiszka {index + 1} z {cards.length}
                        </span>
                        <span>{knownCards.size} zapamiętanych</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100 [&>div]:bg-sky-500" />
                </div>

                <button
                    type="button"
                    onClick={() => setIsFlipped((value) => !value)}
                    className="group min-h-[390px] flex-1 outline-none [perspective:1400px]"
                >
                    <div
                        className="relative h-full min-h-[390px] w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] group-focus-visible:ring-2 group-focus-visible:ring-sky-500 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#eef3f8]"
                        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                    >
                        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-lg border border-sky-200 bg-[#dcecff] p-6 text-left shadow-xl shadow-sky-900/10 [backface-visibility:hidden]">
                            <div className="mb-6 flex items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold uppercase text-white">
                                    <Sparkles className="size-3.5" />
                                    Pytanie
                                </div>
                                <span className="rounded-lg border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-sky-900">
                                    {index + 1}/{cards.length}
                                </span>
                            </div>
                            <div className="flex flex-1 items-center justify-center">
                                <p className="max-w-3xl text-center text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
                                    {currentCard.front}
                                </p>
                            </div>
                            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-sky-100">
                                <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-lg border border-emerald-200 bg-[#dff8eb] p-6 text-left shadow-xl shadow-emerald-900/10 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                            <div className="mb-6 flex items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase text-white">
                                    <CheckCircle2 className="size-3.5" />
                                    Odpowiedź
                                </div>
                                <span className="rounded-lg border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-emerald-900">
                                    {index + 1}/{cards.length}
                                </span>
                            </div>
                            <div className="flex flex-1 items-center justify-center">
                                <p className="max-w-3xl text-center text-2xl font-semibold leading-relaxed text-slate-950 sm:text-3xl">
                                    {currentCard.back}
                                </p>
                            </div>
                            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                </button>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Button
                        variant="outline"
                        onClick={() => goToCard(Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-40"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsFlipped((value) => !value)}
                        className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 hover:text-sky-950"
                    >
                        <RotateCcw className="mr-2 size-4" />
                        Odwróć
                    </Button>
                    <Button
                        variant="outline"
                        onClick={skipCard}
                        disabled={index === cards.length - 1}
                        className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-950 disabled:opacity-40"
                    >
                        <SkipForward className="mr-2 size-4" />
                        Pomiń
                    </Button>
                    <Button onClick={markKnown} className="bg-emerald-600 text-white hover:bg-emerald-700">
                        <CheckCircle2 className="mr-2 size-4" />
                        Znam
                    </Button>
                </div>
            </div>
        </main>
    );
}
