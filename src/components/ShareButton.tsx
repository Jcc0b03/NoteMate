"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toggleNoteShare, setPublicEditable } from "@/actions/share-actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ShareButtonProps {
    noteId: string;
    initialIsShared: boolean;
    initialShareToken: string | null;
    initialIsPublicEditable?: boolean;
}

export function ShareButton({ noteId, initialIsShared, initialShareToken, initialIsPublicEditable = false }: ShareButtonProps) {
    const [isShared, setIsShared] = useState(initialIsShared);
    const [shareToken, setShareToken] = useState(initialShareToken);
    const [isPublicEditable, setIsPublicEditable] = useState(initialIsPublicEditable);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const shareUrl = shareToken
        ? `${origin}/share/${shareToken}`
        : "";

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const result = await toggleNoteShare(noteId);
            if (result.success && result.isShared !== undefined) {
                setIsShared(result.isShared);
                setShareToken(result.shareToken ?? null);
            }
        } catch (error) {
            console.error("Share toggle failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublicEditableChange = async (checked: boolean) => {
        setIsPublicEditable(checked);
        try {
            await setPublicEditable(noteId, checked);
        } catch (error) {
            console.error("Failed to update public editable status", error);
            setIsPublicEditable(!checked); // Revert on error
        }
    };

    const copyToClipboard = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="bg-[#1E90FF] hover:bg-blue-600 text-white gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden md:inline">Udostępnij</span>
                    <span className="md:hidden">Udostępnij</span> {/* Force text if wanted, or just icon on mobile as per previous design */}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <h4 className="font-medium leading-none">Udostępnianie notatki</h4>
                        <p className="text-sm text-muted-foreground">
                            Udostępnij tę notatkę innym osobom za pomocą linku.
                        </p>
                    </div>

                    <div className="flex items-center justify-between space-x-2 border rounded-lg p-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Link Publiczny</span>
                            <span className="text-xs text-muted-foreground">
                                {isShared ? "Włączony" : "Wyłączony"}
                            </span>
                        </div>
                        <Button
                            variant={isShared ? "destructive" : "default"}
                            size="sm"
                            onClick={handleToggle}
                            disabled={isLoading}
                        >
                            {isLoading ? "..." : (isShared ? "Wyłącz" : "Włącz")}
                        </Button>
                    </div>

                    {isShared && (
                        <div className="flex items-center justify-between space-x-2 border rounded-lg p-3">
                            <Label htmlFor="public-editable" className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Edytowanie przez gości</span>
                                <span className="text-xs text-muted-foreground">
                                    Pozwól każdemu z linkiem na edycję
                                </span>
                            </Label>
                            <Switch
                                id="public-editable"
                                checked={isPublicEditable}
                                onCheckedChange={handlePublicEditableChange}
                            />
                        </div>
                    )}

                    {isShared && (
                        <div className="flex items-center space-x-2">
                            <Input
                                value={shareUrl}
                                readOnly
                                className="h-8 text-xs"
                            />
                            <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-8 w-8 shrink-0">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
