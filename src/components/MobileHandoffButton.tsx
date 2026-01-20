"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "react-qr-code";
import { Copy, Smartphone, Loader2, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface HandoffFile {
    url: string;
    pathname: string;
    size: number;
}

interface MobileHandoffButtonProps {
    onUpload: (files: HandoffFile[]) => void;
    className?: string;
    children?: React.ReactNode;
}

export function MobileHandoffButton({ onUpload, className, children }: MobileHandoffButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [uploadUrl, setUploadUrl] = useState<string>("");
    const [copied, setCopied] = useState(false);

    // Track received files to support sequential arrival
    const [receivedCount, setReceivedCount] = useState(0);
    const processedUrlsRef = useRef<Set<string>>(new Set());

    // Generate Session ID when dialog opens
    useEffect(() => {
        if (isOpen) {
            const newSessionId = crypto.randomUUID();
            setSessionId(newSessionId);
            // Use window.location.origin to handle local, ngrok, or production URLs
            setUploadUrl(`${window.location.origin}/mobile-upload?session=${newSessionId}`);

            // Reset state
            setReceivedCount(0);
            processedUrlsRef.current.clear();
        } else {
            setSessionId(null);
            setUploadUrl("");
        }
    }, [isOpen]);

    // Poll for changes
    useEffect(() => {
        if (!sessionId || !isOpen) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/handoff/poll?sessionId=${sessionId}`, {
                    headers: {
                        "ngrok-skip-browser-warning": "69420",
                    },
                });
                if (!res.ok) return;

                const data = await res.json();

                // Handle files
                if (data.found && data.blobs && data.blobs.length > 0) {
                    const newBlobs: HandoffFile[] = [];
                    let sessionComplete = false;

                    data.blobs.forEach((blob: HandoffFile) => {
                        if (blob.pathname.includes('_SESSION_COMPLETE_')) {
                            sessionComplete = true;
                            return; // Don't add marker to files
                        }

                        if (!processedUrlsRef.current.has(blob.url)) {
                            processedUrlsRef.current.add(blob.url);
                            newBlobs.push(blob);
                        }
                    });

                    if (newBlobs.length > 0) {
                        onUpload(newBlobs);
                        setReceivedCount(prev => prev + newBlobs.length);
                    }

                    // Close dialog automatically if mobile signaled completion
                    if (sessionComplete) {
                        setTimeout(() => setIsOpen(false), 1000);
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [sessionId, isOpen, onUpload]);

    const copyToClipboard = useCallback(() => {
        if (!uploadUrl) return;
        navigator.clipboard.writeText(uploadUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [uploadUrl]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className={className}>
                    {children || (
                        <>
                            <Smartphone className="h-4 w-4 mr-2" />
                            Mobile Handoff
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Prześlij z telefonu</DialogTitle>
                    <DialogDescription>
                        Zeskanuj kod QR, aby dodać zdjęcia. Nie zamykaj tego okna, dopóki wszystkie pliki nie pojawią się na liście.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    {uploadUrl ? (
                        <div className="rounded-lg border bg-white p-4 shadow-sm relative">
                            {receivedCount > 0 && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-in fade-in">
                                    <div className="bg-green-100 p-3 rounded-full mb-3">
                                        <Download className="h-8 w-8 text-green-600" />
                                    </div>
                                    <p className="font-bold text-lg text-gray-900">Odebrano: {receivedCount}</p>
                                    <p className="text-sm text-gray-500">Czekam na więcej...</p>
                                </div>
                            )}
                            <QRCode
                                value={uploadUrl}
                                size={200}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                    ) : (
                        <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg border bg-muted">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {receivedCount === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Oczekiwanie na połączenie...
                        </div>
                    ) : (
                        <Button onClick={() => setIsOpen(false)} variant="default" className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Check className="mr-2 h-4 w-4" />
                            Gotowe ({receivedCount})
                        </Button>
                    )}
                </div>

                {receivedCount === 0 && (
                    <div className="flex items-center space-x-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            onClick={copyToClipboard}
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" /> Link skopiowany
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" /> Kopiuj link bezpośredni
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
