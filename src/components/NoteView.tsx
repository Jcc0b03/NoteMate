"use client";

import React, { useState } from "react";
import {
    Share2,
    MoreVertical,
    ZoomIn,
    ZoomOut,
    Copy,
    Send,
    Trash2,
    Download,
    Edit2,
    Save,
    X,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    FileArchive,
    FileText,
    LayoutDashboard,
    Upload
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // Removed
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { updateNoteTitle, deleteNote, cloneNote, updateNoteDetails, addNoteFiles } from "@/actions/note";
import { ShareButton } from "@/components/ShareButton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import { NoteSettingsForm } from "./NoteSettingsForm";
import { NoteFileUpload, FileUpload } from "./NoteFileUpload";
import { NoteAiStatus } from "@/components/NoteAiStatus";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NoteViewProps {
    note: {
        id: string;
        title: string | null;
        content: string | null;
        summary: string | null;
        createdAt: Date;
        files: { id: string; url: string; name: string }[];
        isShared: boolean;
        shareToken: string | null;
        viewCount: number;
        isPublicEditable?: boolean;
        subject?: { name: string } | null;
        tags: string[];
        status?: string;
    };
    readOnly?: boolean;
    isOwner?: boolean;
}

export function NoteView({ note, readOnly = false, isOwner = false }: NoteViewProps) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [zoom, setZoom] = useState(100);
    const [title, setTitle] = useState(note.title || "Bez tytułu");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);

    const files = note.files.length > 0
        ? note.files.map(f => {
            const isPdf = f.name.toLowerCase().endsWith('.pdf');
            return {
                url: `/api/file?fileId=${f.id}`,
                type: isPdf ? 'pdf' : 'image',
                name: f.name
            };
        })
        : [{ url: "/placeholder-image-if-no-files.png", type: 'image', name: 'Placeholder' }];

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

    const handlePrevFile = () => {
        setCurrentFileIndex((prev) => (prev > 0 ? prev - 1 : prev));
    };

    const handleNextFile = () => {
        setCurrentFileIndex((prev) => (prev < files.length - 1 ? prev + 1 : prev));
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(note.title || "Bez tytułu");
    const [editSubject, setEditSubject] = useState(note.subject?.name || "");
    const [editTags, setEditTags] = useState<string[]>(note.tags || []);
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    // Upload Modal State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [newFiles, setNewFiles] = useState<FileUpload[]>([]);
    const [isSavingFiles, setIsSavingFiles] = useState(false);

    const canEdit = isOwner || (!readOnly && note.isPublicEditable);

    const handleCloneNote = async () => {
        setIsCloning(true);
        const result = await cloneNote(note.id);
        if (result.success && result.noteId) {
            router.push(`/notes/${result.noteId}`);
        } else {
            console.error("Failed to clone note:", result.error);
            setIsCloning(false);
        }
    };

    const handleDeleteNote = async () => {
        setIsDeleting(true);
        const result = await deleteNote(note.id);
        if (result.success) {
            router.push("/app");
        } else {
            console.error("Failed to delete note:", result.error);
            setIsDeleting(false);
        }
    };

    const handleSaveTitle = async () => {
        setIsEditingTitle(false);
        if (title.trim() === "") {
            setTitle(note.title || "Bez tytułu");
            return;
        }
        if (title === note.title) return;

        const result = await updateNoteTitle(note.id, title);
        if (!result.success) {
            console.error("Failed to update title:", result.error);
            // Optionally revert title or show toast
        }
    };

    const handleSaveDetails = async () => {
        setIsSavingDetails(true);
        try {
            const result = await updateNoteDetails(note.id, {
                title: editTitle,
                subjectName: editSubject,
                tags: editTags
            });

            if (result.success) {
                setIsEditOpen(false);
                setTitle(editTitle); // Local update
                // Router refresh is handled in action revalidatePath, 
                // but local state update provides immediate feedback for title.
            } else {
                console.error("Failed to update details:", result.error);
            }
        } catch (error) {
            console.error("Error saving details:", error);
        } finally {
            setIsSavingDetails(false);
        }
    };

    const handleSaveFiles = async () => {
        // Filter only complete files
        const filesToSave = newFiles.filter(f => f.status === 'complete').map(f => ({
            url: f.url!,
            name: f.file.name,
            type: f.file.type || 'unknown',
            size: f.file.size
        }));

        if (filesToSave.length === 0) return;

        setIsSavingFiles(true);
        try {
            const result = await addNoteFiles(note.id, filesToSave);
            if (result.success) {
                setIsUploadOpen(false);
                setNewFiles([]);
            } else {
                console.error("Failed to add files:", result.error);
            }
        } catch (error) {
            console.error("Error adding files:", error);
        } finally {
            setIsSavingFiles(false);
        }
    };

    return (
        <div className="h-screen flex flex-col font-sans bg-background text-foreground">
            {/* Header */}
            <header className="border-b p-4 flex justify-between items-center bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/app")} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 h-8">
                            {isEditingTitle && !readOnly ? (
                                <div className="flex items-center gap-1">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-8 text-xl font-bold w-[200px] md:w-[300px]"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleSaveTitle();
                                            }
                                        }}
                                        onBlur={handleSaveTitle}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-xl md:text-2xl font-bold text-foreground truncate max-w-[200px] md:max-w-md">
                                        {title}
                                    </h1>
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                                            onClick={() => setIsEditingTitle(true)}
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                        <span className="text-xs md:text-sm text-muted-foreground mt-1">
                            {readOnly ? (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-100 font-medium">
                                    Tryb podglądu
                                </span>
                            ) : (
                                `Dodano ${new Date(note.createdAt).toLocaleDateString('pl-PL')}`
                            )}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground ml-4 gap-1 bg-muted/50 px-2 py-1 rounded-md">
                            <span className="font-semibold text-foreground">{note.viewCount}</span>
                            <span>wyświetleń</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">

                    {/* Add Files Button - Only if can Edit */}
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsUploadOpen(true)}
                            title="Dodaj pliki"
                        >
                            <Upload className="size-4" />
                        </Button>
                    )}

                    {isOwner ? (
                        <ShareButton
                            noteId={note.id}
                            initialIsShared={note.isShared}
                            initialShareToken={note.shareToken}
                            initialIsPublicEditable={note.isPublicEditable}
                        />
                    ) : (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                            onClick={handleCloneNote}
                            disabled={isCloning}
                        >
                            {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden md:inline">Zapisz u siebie</span>
                            <span className="md:hidden">Zapisz</span>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* Edit Option - Only if can Edit */}
                            {canEdit && (
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                    <Edit2 className="w-4 h-4 mr-2" /> Edytuj szczegóły
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={() => {
                                if (!note.summary) return;
                                const blob = new Blob([note.summary], { type: "text/plain" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${note.title || "notatka"}_podsumowanie.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}>
                                <Download className="w-4 h-4 mr-2" /> Pobierz podsumowanie
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (isDownloadingZip) return;
                                    setIsDownloadingZip(true);
                                    try {
                                        const JSZip = (await import("jszip")).default;
                                        const zip = new JSZip();

                                        const filePromises = note.files.map(async (file) => {
                                            try {
                                                const response = await fetch(`/api/file?fileId=${file.id}`);
                                                if (!response.ok) throw new Error("Network response was not ok");
                                                const blob = await response.blob();
                                                zip.file(file.name, blob);
                                            } catch (error) {
                                                console.error(`Failed to download file ${file.name}`, error);
                                            }
                                        });

                                        await Promise.all(filePromises);

                                        const content = await zip.generateAsync({ type: "blob" });
                                        const url = URL.createObjectURL(content);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = `${note.title || "notatka"}_pliki.zip`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    } catch (error) {
                                        console.error("Failed to generate zip", error);
                                    } finally {
                                        setIsDownloadingZip(false);
                                    }
                                }}
                                disabled={isDownloadingZip}
                                className="cursor-pointer"
                            >
                                {isDownloadingZip ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <FileArchive className="w-4 h-4 mr-2" />
                                )}
                                {isDownloadingZip ? "Pobieranie..." : "Pobierz pliki jako ZIP"}
                            </DropdownMenuItem>

                            {/* Delete only for Owner + Not ReadOnly */}
                            {isOwner && !readOnly && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> Usuń notatkę
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Content */}
            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup orientation={isMobile ? "vertical" : "horizontal"}>

                    {/* Left Panel - Source of Truth */}
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="relative w-full h-full bg-gray-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center p-4">
                            {note.files.length > 0 ? (
                                <div
                                    className="transition-transform duration-200 ease-out origin-center w-full h-full flex items-center justify-center"
                                    style={{ transform: `scale(${zoom / 100})` }}
                                >
                                    {files[currentFileIndex].type === 'pdf' ? (
                                        <iframe
                                            src={`${files[currentFileIndex].url}#toolbar=0`}
                                            className="w-full h-full shadow-lg rounded-lg bg-white"
                                            title={files[currentFileIndex].name}
                                        />
                                    ) : (
                                        <img
                                            src={files[currentFileIndex].url}
                                            alt={`Notatka - ${files[currentFileIndex].name}`}
                                            className="max-w-full shadow-lg rounded-lg object-contain"
                                            style={{ maxHeight: '80vh' }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center gap-2">
                                    <p>Brak podglądu plików</p>
                                </div>
                            )}

                            {/* Zoom Controls */}
                            <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                                <Button size="icon" variant="secondary" onClick={handleZoomOut}>
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="secondary" onClick={handleZoomIn}>
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Image Navigation */}
                            {files.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-sm z-10">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrevFile}
                                        disabled={currentFileIndex === 0}
                                        className="h-8 w-8 rounded-full"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm font-medium tabular-nums">
                                        {currentFileIndex + 1} / {files.length}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNextFile}
                                        disabled={currentFileIndex === files.length - 1}
                                        className="h-8 w-8 rounded-full"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right Panel - Content & Workspace */}
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="h-full bg-background flex flex-col p-4">
                            <Tabs defaultValue="summary" className="w-full h-full flex flex-col">
                                <div className="mb-4">
                                    <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6 border-b">
                                        <TabsTrigger
                                            value="summary"
                                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#1E90FF] data-[state=active]:shadow-none data-[state=active]:text-[#1E90FF] rounded-none px-0 pb-3 pt-3 font-semibold text-muted-foreground transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none"
                                        >
                                            Podsumowanie
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="chat"
                                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#1E90FF] data-[state=active]:shadow-none data-[state=active]:text-[#1E90FF] rounded-none px-0 pb-3 pt-3 font-semibold text-muted-foreground transition-all focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none outline-none"
                                        >
                                            Asystent AI
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="summary" className="flex-1 p-0 m-0 overflow-hidden">
                                    <div className="h-full bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col overflow-hidden">
                                        <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur shrink-0">
                                            <h1 className="text-lg font-semibold flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                                Podsumowanie
                                            </h1>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <ScrollArea className="h-full p-6">
                                                <NoteAiStatus
                                                    noteId={note.id}
                                                    status={(note.status as "PROCESSING" | "COMPLETED" | "FAILED") ?? "COMPLETED"}
                                                    hasSummary={Boolean(note.summary)}
                                                    canProcess={isOwner}
                                                />
                                                {note.summary && (
                                                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-blue-600">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.summary}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </TabsContent>



                                <TabsContent value="chat" className="flex-1 p-0 m-0 overflow-hidden">
                                    <ChatInterface note={note} readOnly={readOnly} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Note Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-lg">
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
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Anuluj
                        </Button>
                        <Button onClick={handleSaveDetails} disabled={isSavingDetails}>
                            {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zapisz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Files Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Dodaj pliki</DialogTitle>
                        <DialogDescription>
                            Prześlij dodatkowe pliki do tej notatki.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <NoteFileUpload
                            files={newFiles}
                            setFiles={setNewFiles}
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleSaveFiles}
                            disabled={isSavingFiles || newFiles.length === 0 || newFiles.some(f => f.status === 'uploading')}
                        >
                            {isSavingFiles && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Dodaj pliki
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Czy na pewno chcesz usunąć tę notatkę?</DialogTitle>
                        <DialogDescription>
                            Tej operacji nie można cofnąć. Notatka oraz wszystkie powiązane pliki zostaną trwale usunięte.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Anuluj
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteNote}
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
        </div >
    );
}
