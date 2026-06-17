"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { AlertCircle, CreditCard, ExternalLink, Loader2, QrCode, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardDeck {
    id: string;
    token: string;
    title: string | null;
    cards: Flashcard[];
    createdAt: string;
}

interface NoteFlashcardsPanelProps {
    noteId: string;
    noteStatus?: string;
}

export function NoteFlashcardsPanel({ noteId, noteStatus }: NoteFlashcardsPanelProps) {
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [qrDeck, setQrDeck] = useState<FlashcardDeck | null>(null);
    const [origin, setOrigin] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isReady = noteStatus === "COMPLETED";

    const loadDecks = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ai/flashcards?noteId=${encodeURIComponent(noteId)}`);
            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                setError(data?.error || "Nie udało się pobrać zapisanych zestawów fiszek.");
                return;
            }

            setDecks(data.decks || []);
        } catch {
            setError("Wystąpił błąd połączenia podczas pobierania zestawów fiszek.");
        } finally {
            setIsLoading(false);
        }
    }, [noteId]);

    useEffect(() => {
        setOrigin(window.location.origin);
        loadDecks();
    }, [loadDecks]);

    const publicUrl = useMemo(() => {
        if (!qrDeck) return "";
        const publicPath = `/flashcards/${qrDeck.token}`;
        return origin ? `${origin}${publicPath}` : publicPath;
    }, [origin, qrDeck]);

    const generateFlashcards = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch("/api/ai/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                setError(data?.error || "Nie udało się wygenerować fiszek.");
                return;
            }

            setDecks((currentDecks) => [data.deck, ...currentDecks]);
        } catch {
            setError("Wystąpił błąd połączenia podczas generowania fiszek.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto px-1 py-1">
                <div className="mx-auto flex max-w-5xl flex-col gap-5">
                    <div className="rounded-lg border border-sky-100 bg-sky-50 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
                                    <CreditCard className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Zestawy fiszek</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Zapisane zestawy są dostępne po powrocie do notatki. Możesz wygenerować kilka wariantów do nauki.
                                    </p>
                                </div>
                            </div>

                            <Button onClick={generateFlashcards} disabled={isGenerating || !isReady} className="bg-sky-600 text-white hover:bg-sky-700">
                                {isGenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                                Nowy zestaw
                            </Button>
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

                    {isLoading ? (
                        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 inline size-4 animate-spin" />
                            Ładowanie zapisanych zestawów fiszek...
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-card p-8 text-center">
                            <CreditCard className="mx-auto mb-3 size-9 text-muted-foreground/60" />
                            <h3 className="font-semibold">Brak zapisanych zestawów</h3>
                            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                                Wygeneruj pierwszy zestaw, a aplikacja zapamięta go i pokaże tutaj przy kolejnym wejściu w notatkę.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            {decks.map((deck) => {
                                const publicPath = `/flashcards/${deck.token}`;
                                return (
                                    <div key={deck.id} className="rounded-lg border bg-card p-5">
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold">{deck.title || "Zestaw fiszek"}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {deck.cards.length} fiszek • {new Date(deck.createdAt).toLocaleDateString("pl-PL")}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button asChild variant="outline">
                                                    <a href={publicPath} target="_blank" rel="noreferrer">
                                                        <ExternalLink className="mr-2 size-4" />
                                                        Otwórz
                                                    </a>
                                                </Button>
                                                <Button variant="outline" onClick={() => setQrDeck(deck)}>
                                                    <QrCode className="mr-2 size-4" />
                                                    Kod QR
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {deck.cards.slice(0, 4).map((card, index) => (
                                                <div key={`${deck.id}-${card.front}-${index}`} className="overflow-hidden rounded-lg border border-slate-200">
                                                    <div className="border-b border-sky-200 bg-sky-50 p-4">
                                                        <div className="text-xs font-semibold uppercase text-sky-700">Pytanie</div>
                                                        <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-950">{card.front}</p>
                                                    </div>
                                                    <div className="bg-emerald-50 p-4">
                                                        <div className="text-xs font-semibold uppercase text-emerald-700">Odpowiedź</div>
                                                        <p className="mt-1 text-sm leading-relaxed text-slate-700">{card.back}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={Boolean(qrDeck)} onOpenChange={(open) => !open && setQrDeck(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="size-5 text-emerald-700" />
                            Kod QR
                        </DialogTitle>
                        <DialogDescription>
                            {qrDeck?.title || "Zestaw fiszek"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-white p-4">
                        {publicUrl && <QRCode value={publicUrl} className="h-auto w-full" />}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Smartphone className="mt-0.5 size-4 shrink-0" />
                        <span>Zeskanuj telefonem, żeby przejść prosto do trybu nauki.</span>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
