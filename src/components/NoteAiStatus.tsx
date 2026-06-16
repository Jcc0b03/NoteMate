"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type NoteStatus = "PROCESSING" | "COMPLETED" | "FAILED";

interface NoteAiStatusProps {
    noteId: string;
    status: NoteStatus;
    hasSummary: boolean;
    /** Whether the current user is allowed to (re)run AI processing. */
    canProcess: boolean;
}

/**
 * Drives AI processing (OCR + summary) for a note.
 * - Auto-starts processing when a note is stuck in PROCESSING (self-heals older notes).
 * - Lets the owner manually (re)generate the summary.
 * Renders nothing when the note is already COMPLETED with a summary.
 */
export function NoteAiStatus({ noteId, status, hasSummary, canProcess }: NoteAiStatusProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const autoTriggered = useRef(false);

    const runProcessing = useCallback(async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.success) {
                setError(data?.error || "Nie udało się przetworzyć notatki.");
            } else {
                router.refresh();
            }
        } catch {
            setError("Wystąpił błąd połączenia podczas przetwarzania.");
        } finally {
            setIsProcessing(false);
        }
    }, [noteId, router]);

    // Auto-heal: if a note is still PROCESSING when opened, kick off processing once.
    useEffect(() => {
        if (canProcess && status === "PROCESSING" && !autoTriggered.current) {
            autoTriggered.current = true;
            runProcessing();
        }
    }, [canProcess, status, runProcessing]);

    const busy = isProcessing || (status === "PROCESSING" && canProcess);

    let inner: ReactNode = null;

    if (busy) {
        inner = (
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-300">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>Asystent AI analizuje Twoje pliki i tworzy podsumowanie…</span>
            </div>
        );
    } else if (error) {
        inner = (
            <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                </div>
                {canProcess && (
                    <Button size="sm" variant="outline" onClick={runProcessing} className="shrink-0">
                        <RefreshCw className="mr-2 size-3.5" />
                        Spróbuj ponownie
                    </Button>
                )}
            </div>
        );
    } else if (status === "FAILED") {
        inner = (
            <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Nie udało się przetworzyć tej notatki.</span>
                </div>
                {canProcess && (
                    <Button size="sm" variant="outline" onClick={runProcessing} className="shrink-0">
                        <RefreshCw className="mr-2 size-3.5" />
                        Przetwórz ponownie
                    </Button>
                )}
            </div>
        );
    } else if (!hasSummary && canProcess) {
        // COMPLETED but no summary yet (e.g. legacy note) — offer manual generation.
        inner = (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">Ta notatka nie ma jeszcze podsumowania AI.</span>
                <Button size="sm" onClick={runProcessing} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                    <Sparkles className="mr-2 size-3.5" />
                    Wygeneruj podsumowanie
                </Button>
            </div>
        );
    }

    if (!inner) return null;

    return <div className="mb-4">{inner}</div>;
}
