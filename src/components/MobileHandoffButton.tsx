"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import { Copy, Smartphone, Loader2, Check } from "lucide-react";
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

    // Generate Session ID when dialog opens
    useEffect(() => {
        if (isOpen) {
            const newSessionId = crypto.randomUUID();
            setSessionId(newSessionId);
            // Use window.location.origin to handle local, ngrok, or production URLs
            setUploadUrl(`${window.location.origin}/mobile-upload?session=${newSessionId}`);
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
                const res = await fetch(`/api/handoff/poll?sessionId=${sessionId}`);
                if (!res.ok) return;

                const data = await res.json();
                if (data.found && data.blobs.length > 0) {
                    onUpload(data.blobs);
                    setIsOpen(false); // Close modal on success
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
                        Zeskanuj kod QR swoim telefonem, aby szybko przesłać zdjęcia notatek.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    {uploadUrl ? (
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
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

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Oczekiwanie na pliki...
                    </div>
                </div>

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
            </DialogContent>
        </Dialog>
    );
}
