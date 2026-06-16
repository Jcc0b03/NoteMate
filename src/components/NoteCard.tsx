"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Sparkles, Share2, Loader2, AlertCircle, MoreVertical, Trash2, Edit2, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deleteNote, updateNoteDetails } from "@/actions/note";
import { NoteSettingsForm } from "./NoteSettingsForm";

export function NoteCard({ id, title, preview, date, tag, color, status, tags = [], subjectName, imageUrl }: { id: string; title: string; preview: string; date: string; tag: string; color: string; status: "PROCESSING" | "COMPLETED" | "FAILED", tags?: string[], subjectName?: string, imageUrl?: string | null }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(title);
    const [editSubject, setEditSubject] = useState(subjectName || "");
    const [editTags, setEditTags] = useState<string[]>(tags);
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    const colorStyles: Record<string, { border: string; bg: string; text: string }> = {
        blue: { border: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700" },
        green: { border: "bg-green-500", bg: "bg-green-100", text: "text-green-700" },
        orange: { border: "bg-orange-500", bg: "bg-orange-100", text: "text-orange-700" },
        purple: { border: "bg-purple-500", bg: "bg-purple-100", text: "text-purple-700" },
    };

    const currentStyle = colorStyles[color] || colorStyles.blue;

    const statusConfig = {
        PROCESSING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Loader2, label: "Przetwarzanie", iconClass: "animate-spin" },
        COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: Sparkles, label: "Gotowe", iconClass: "" },
        FAILED: { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle, label: "Błąd", iconClass: "" },
    };

    const currentStatus = statusConfig[status] || statusConfig.PROCESSING;
    const StatusIcon = currentStatus.icon;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDeleting(true);
        const result = await deleteNote(id);

        if (result.success) {
            setShowDeleteDialog(false);
            router.refresh();
        } else {
            console.error("Failed to delete note:", result.error);
            setIsDeleting(false);
        }
    };

    const handleSaveDetails = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsSavingDetails(true);
        try {
            const result = await updateNoteDetails(id, {
                title: editTitle,
                subjectName: editSubject,
                tags: editTags
            });

            if (result.success) {
                setIsEditOpen(false);
                router.refresh();
            } else {
                console.error("Failed to update details:", result.error);
            }
        } catch (error) {
            console.error("Error saving details:", error);
        } finally {
            setIsSavingDetails(false);
        }
    };

    return (
        <>
            <div className="relative group rounded-3xl bg-card shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-border">
                {/* Left color strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${currentStyle.border} z-10`} />

                {/* More Options Menu - Absolute Top Right */}
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditTitle(title);
                                    setEditSubject(subjectName || "");
                                    setEditTags(tags);
                                    setIsEditOpen(true);
                                }}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteDialog(true);
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Usuń
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="p-5 pl-7 flex flex-col gap-4 h-full">
                    {/* Thumbnail / Preview Area */}
                    <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-muted/40 to-muted/10 border border-border/40">
                        {/* Status Badge */}
                        <div className={`absolute top-3 right-3 z-10 ${currentStatus.bg} ${currentStatus.text} px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm`}>
                            <StatusIcon className={`size-3 ${currentStatus.iconClass}`} />
                            <span>{currentStatus.label}</span>
                        </div>

                        {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageUrl}
                                alt={title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                <FileText className="size-12" />
                            </div>
                        )}
                    </div>

                    {/* Text Content */}
                    <div>
                        <h3 className="font-bold text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2 leading-relaxed">{preview}</p>
                    </div>

                    {/* Meta Tags Row */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${currentStyle.bg} ${currentStyle.text}`}>
                            {tag}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{date}</span>
                    </div>

                    {/* Footer Separator */}
                    <div className="h-px w-full bg-border/50 my-1" />

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-auto">
                        <Avatar className="size-8 bg-purple-100 text-purple-600">
                            <AvatarFallback className="bg-purple-100 text-purple-600 font-bold text-xs">JD</AvatarFallback>
                        </Avatar>

                        <div className="flex items-center gap-1">
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full">
                                <Share2 className="size-4" />
                            </button>
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full">
                                <MessageSquare className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isEditOpen} onOpenChange={(open) => {
                if (!open) setIsEditOpen(false);
            }}>
                <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edytuj notatkę</DialogTitle>
                        <DialogDescription>
                            Zmień tytuł, przedmiot lub tagi.
                        </DialogDescription>
                    </DialogHeader>

                    <NoteSettingsForm
                        title={editTitle}
                        setTitle={setEditTitle}
                        subjectValue={editSubject}
                        setSubjectValue={setEditSubject}
                        tags={editTags}
                        setTags={setEditTags}
                    />

                    <DialogFooter>
                        <Button variant="outline" onClick={(e) => { e.stopPropagation(); setIsEditOpen(false); }}>
                            Anuluj
                        </Button>
                        <Button onClick={handleSaveDetails} disabled={isSavingDetails}>
                            {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zapisz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Czy na pewno chcesz usunąć tę notatkę?</DialogTitle>
                        <DialogDescription>
                            Tej operacji nie można cofnąć. Notatka oraz wszystkie powiązane pliki zostaną trwale usunięte.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(false); }}>
                            Anuluj
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Usuwanie...
                                </>
                            ) : (
                                "Usuń"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
