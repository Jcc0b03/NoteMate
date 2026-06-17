"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { AlertCircle, CreditCard, ExternalLink, Loader2, QrCode, RefreshCw, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardDeck {
    id: string;
    token: string;
    title: string | null;
    cards: Flashcard[];
}

interface NoteFlashcardsPanelProps {
    noteId: string;
    noteStatus?: string;
}

export function NoteFlashcardsPanel({ noteId, noteStatus }: NoteFlashcardsPanelProps) {
    const [deck, setDeck] = useState<FlashcardDeck | null>(null);
    const [origin, setOrigin] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const publicPath = deck ? `/flashcards/${deck.token}` : "";
    const publicUrl = useMemo(() => (origin && publicPath ? `${origin}${publicPath}` : publicPath), [origin, publicPath]);

    const generateFlashcards = async (regenerate = false) => {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch("/api/ai/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId, regenerate }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                setError(data?.error || "Nie udało się wygenerować fiszek.");
                return;
            }

            setDeck(data.deck);
        } catch {
            setError("Wystąpił błąd połączenia podczas generowania fiszek.");
        } finally {
            setIsGenerating(false);
        }
    };

    const isReady = noteStatus === "COMPLETED";

    return (
        <div className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto px-1 py-1">
                <div className="mx-auto flex max-w-4xl flex-col gap-5">
                    <div className="rounded-lg border bg-card p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    <CreditCard className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Fiszki z notatki</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Wygeneruj talię z podsumowania i transkrypcji, a potem otwórz ją na telefonie przez QR.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {deck && (
                                    <Button variant="outline" onClick={() => generateFlashcards(true)} disabled={isGenerating}>
                                        {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                                        Odśwież
                                    </Button>
                                )}
                                <Button onClick={() => generateFlashcards(Boolean(deck))} disabled={isGenerating || !isReady}>
                                    {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                                    {deck ? "Wygeneruj ponownie" : "Generuj fiszki"}
                                </Button>
                            </div>
                        </div>

                        {!isReady && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>Fiszki będą dostępne po zakończeniu przetwarzania notatki przez AI.</span>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {deck && (
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                            <div className="rounded-lg border bg-card p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold">{deck.title || "Fiszki"}</h3>
                                        <p className="text-sm text-muted-foreground">{deck.cards.length} fiszek gotowych do nauki</p>
                                    </div>
                                    <Button asChild variant="outline">
                                        <a href={publicPath} target="_blank" rel="noreferrer">
                                            <ExternalLink className="mr-2 size-4" />
                                            Otwórz
                                        </a>
                                    </Button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {deck.cards.slice(0, 6).map((card, index) => (
                                        <div key={`${card.front}-${index}`} className="rounded-lg border bg-background p-4">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pytanie</div>
                                            <p className="mt-1 text-sm font-medium">{card.front}</p>
                                            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Odpowiedź</div>
                                            <p className="mt-1 text-sm text-muted-foreground">{card.back}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border bg-card p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <QrCode className="size-5 text-emerald-700 dark:text-emerald-300" />
                                    <h3 className="font-semibold">Kod QR</h3>
                                </div>
                                <div className="rounded-lg bg-white p-4">
                                    <QRCode value={publicUrl} className="h-auto w-full" />
                                </div>
                                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                                    <Smartphone className="mt-0.5 size-4 shrink-0" />
                                    <span>Zeskanuj telefonem, żeby przejść prosto do trybu nauki.</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
