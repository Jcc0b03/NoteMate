"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    AlignLeft,
    ArrowLeft,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Copy,
    CreditCard,
    Download,
    Edit2,
    Eye,
    FileArchive,
    FileText,
    Loader2,
    MessageSquare,
    MoreVertical,
    Tag,
    Trash2,
    Upload,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { addNoteFiles, cloneNote, deleteNote, updateNoteDetails, updateNoteTitle } from "@/actions/note";
import { ShareButton } from "@/components/ShareButton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChatInterface } from "@/components/chat-interface";
import { NoteSettingsForm } from "./NoteSettingsForm";
import { FileUpload, NoteFileUpload } from "./NoteFileUpload";
import { NoteAiStatus } from "@/components/NoteAiStatus";
import { NoteFlashcardsPanel } from "@/components/NoteFlashcardsPanel";
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

    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editTitle, setEditTitle] = useState(note.title || "Bez tytułu");
    const [editSubject, setEditSubject] = useState(note.subject?.name || "");
    const [editTags, setEditTags] = useState<string[]>(note.tags || []);
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [newFiles, setNewFiles] = useState<FileUpload[]>([]);
    const [isSavingFiles, setIsSavingFiles] = useState(false);

    const canEdit = isOwner || (!readOnly && note.isPublicEditable);
    const normalizedStatus = (note.status as "PROCESSING" | "COMPLETED" | "FAILED") ?? "COMPLETED";

    const files = note.files.length > 0
        ? note.files.map((file) => {
            const isPdf = file.name.toLowerCase().endsWith(".pdf");
            return {
                url: `/api/file?fileId=${file.id}`,
                type: isPdf ? "pdf" : "image",
                name: file.name,
            };
        })
        : [{ url: "/placeholder-image-if-no-files.png", type: "image", name: "Brak pliku" }];

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
    const handlePrevFile = () => setCurrentFileIndex((prev) => (prev > 0 ? prev - 1 : prev));
    const handleNextFile = () => setCurrentFileIndex((prev) => (prev < files.length - 1 ? prev + 1 : prev));

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
        }
    };

    const handleSaveDetails = async () => {
        setIsSavingDetails(true);
        try {
            const result = await updateNoteDetails(note.id, {
                title: editTitle,
                subjectName: editSubject,
                tags: editTags,
            });

            if (result.success) {
                setIsEditOpen(false);
                setTitle(editTitle);
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
        const filesToSave = newFiles.filter((file) => file.status === "complete").map((file) => ({
            url: file.url!,
            name: file.file.name,
            type: file.file.type || "unknown",
            size: file.file.size,
        }));

        if (filesToSave.length === 0) return;

        setIsSavingFiles(true);
        try {
            const result = await addNoteFiles(note.id, filesToSave);
            if (result.success) {
                setIsUploadOpen(false);
                setNewFiles([]);
                router.refresh();
            } else {
                console.error("Failed to add files:", result.error);
            }
        } catch (error) {
            console.error("Error adding files:", error);
        } finally {
            setIsSavingFiles(false);
        }
    };

    const downloadSummary = () => {
        if (!note.summary) return;
        const blob = new Blob([note.summary], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${note.title || "notatka"}_podsumowanie.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const downloadFilesAsZip = async () => {
        if (isDownloadingZip) return;
        setIsDownloadingZip(true);

        try {
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            await Promise.all(note.files.map(async (file) => {
                try {
                    const response = await fetch(`/api/file?fileId=${file.id}`);
                    if (!response.ok) throw new Error("Network response was not ok");
                    const blob = await response.blob();
                    zip.file(file.name, blob);
                } catch (error) {
                    console.error(`Failed to download file ${file.name}`, error);
                }
            }));

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${note.title || "notatka"}_pliki.zip`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate zip", error);
        } finally {
            setIsDownloadingZip(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-background font-sans text-foreground">
            <header className="border-b bg-card/95 px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/app")} className="mt-1 shrink-0 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-5" />
                        </Button>

                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                {isEditingTitle && !readOnly ? (
                                    <Input
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        className="h-9 w-[220px] text-xl font-bold md:w-[360px]"
                                        autoFocus
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") handleSaveTitle();
                                        }}
                                        onBlur={handleSaveTitle}
                                    />
                                ) : (
                                    <>
                                        <h1 className="truncate text-xl font-bold text-foreground md:text-2xl">{title}</h1>
                                        {!readOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 shrink-0 text-muted-foreground hover:text-primary"
                                                onClick={() => setIsEditingTitle(true)}
                                            >
                                                <Edit2 className="size-3.5" />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {readOnly && (
                                    <span className="rounded-full bg-sky-100 px-2 py-1 font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-100">
                                        Tryb podglądu
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                                    <CalendarDays className="size-3.5" />
                                    {new Date(note.createdAt).toLocaleDateString("pl-PL")}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                                    <Eye className="size-3.5" />
                                    {note.viewCount} wyświetleń
                                </span>
                                {note.subject?.name && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                                        <Tag className="size-3.5" />
                                        {note.subject.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {canEdit && (
                            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
                                <Upload className="mr-2 size-4" />
                                Dodaj pliki
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
                            <Button className="gap-2 bg-green-600 text-white hover:bg-green-700" onClick={handleCloneNote} disabled={isCloning}>
                                {isCloning ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
                                Zapisz u siebie
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="size-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canEdit && (
                                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                        <Edit2 className="mr-2 size-4" />
                                        Edytuj szczegóły
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={downloadSummary}>
                                    <Download className="mr-2 size-4" />
                                    Pobierz podsumowanie
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={downloadFilesAsZip} disabled={isDownloadingZip} className="cursor-pointer">
                                    {isDownloadingZip ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <FileArchive className="mr-2 size-4" />
                                    )}
                                    {isDownloadingZip ? "Pobieranie..." : "Pobierz pliki jako ZIP"}
                                </DropdownMenuItem>
                                {isOwner && !readOnly && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="cursor-pointer text-destructive focus:text-destructive"
                                            onClick={() => setShowDeleteDialog(true)}
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Usuń notatkę
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <ResizablePanelGroup orientation={isMobile ? "vertical" : "horizontal"}>
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="flex h-full flex-col bg-muted/30">
                            <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{files[currentFileIndex]?.name || "Brak pliku"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {note.files.length > 0 ? `Plik ${currentFileIndex + 1} z ${files.length}` : "Nie dodano plików"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" onClick={handleZoomOut} aria-label="Pomniejsz">
                                        <ZoomOut className="size-4" />
                                    </Button>
                                    <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">{zoom}%</span>
                                    <Button size="icon" variant="ghost" onClick={handleZoomIn} aria-label="Powiększ">
                                        <ZoomIn className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
                                {note.files.length > 0 ? (
                                    <div
                                        className="relative flex h-full w-full origin-center items-center justify-center transition-transform duration-200 ease-out"
                                        style={{ transform: `scale(${zoom / 100})` }}
                                    >
                                        {files[currentFileIndex].type === "pdf" ? (
                                            <iframe
                                                src={`${files[currentFileIndex].url}#toolbar=0`}
                                                className="h-full w-full rounded-lg bg-white shadow-sm"
                                                title={files[currentFileIndex].name}
                                            />
                                        ) : (
                                            <Image
                                                src={files[currentFileIndex].url}
                                                alt={`Notatka - ${files[currentFileIndex].name}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                unoptimized
                                                className="rounded-lg object-contain shadow-sm"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileText className="size-10 opacity-50" />
                                        <p>Brak podglądu plików</p>
                                    </div>
                                )}
                            </div>

                            {files.length > 1 && (
                                <div className="flex h-14 shrink-0 items-center justify-center gap-3 border-t bg-background px-4">
                                    <Button variant="outline" size="icon" onClick={handlePrevFile} disabled={currentFileIndex === 0}>
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                    <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                        {currentFileIndex + 1} / {files.length}
                                    </span>
                                    <Button variant="outline" size="icon" onClick={handleNextFile} disabled={currentFileIndex === files.length - 1}>
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="flex h-full flex-col bg-background">
                            <Tabs defaultValue="summary" className="flex min-h-0 w-full flex-1 flex-col">
                                <div className="border-b bg-card/80 px-4">
                                    <TabsList className="grid h-14 w-full grid-cols-4 bg-transparent p-0">
                                        <TabsTrigger value="summary" className="h-full gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 text-muted-foreground shadow-none focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-sky-600 data-[state=active]:bg-transparent data-[state=active]:text-sky-700 data-[state=active]:shadow-none">
                                            <FileText className="size-4" />
                                            Podsumowanie
                                        </TabsTrigger>
                                        <TabsTrigger value="transcript" className="h-full gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 text-muted-foreground shadow-none focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-sky-600 data-[state=active]:bg-transparent data-[state=active]:text-sky-700 data-[state=active]:shadow-none">
                                            <AlignLeft className="size-4" />
                                            Transkrypcja
                                        </TabsTrigger>
                                        <TabsTrigger value="flashcards" className="h-full gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 text-muted-foreground shadow-none focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-sky-600 data-[state=active]:bg-transparent data-[state=active]:text-sky-700 data-[state=active]:shadow-none">
                                            <CreditCard className="size-4" />
                                            Fiszki
                                        </TabsTrigger>
                                        <TabsTrigger value="chat" className="h-full gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-2 text-muted-foreground shadow-none focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-sky-600 data-[state=active]:bg-transparent data-[state=active]:text-sky-700 data-[state=active]:shadow-none">
                                            <MessageSquare className="size-4" />
                                            Asystent
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="summary" className="m-0 min-h-0 flex-1 overflow-hidden p-0">
                                    <ScrollArea className="h-full">
                                        <div className="mx-auto max-w-3xl px-5 py-6">
                                            <NoteAiStatus
                                                noteId={note.id}
                                                status={normalizedStatus}
                                                hasSummary={Boolean(note.summary)}
                                                canProcess={isOwner}
                                            />
                                            {note.summary ? (
                                                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-blue-600 dark:prose-invert md:prose-base">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.summary}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                                    Podsumowanie pojawi się tutaj po zakończeniu analizy AI.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="transcript" className="m-0 min-h-0 flex-1 overflow-hidden p-0">
                                    <ScrollArea className="h-full">
                                        <div className="mx-auto max-w-3xl px-5 py-6">
                                            {note.content ? (
                                                <div className="whitespace-pre-wrap rounded-lg border bg-card p-5 text-sm leading-7 text-foreground">
                                                    {note.content}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                                    Transkrypcja pojawi się tutaj po zakończeniu analizy AI.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="flashcards" className="m-0 min-h-0 flex-1 overflow-hidden p-4">
                                    <NoteFlashcardsPanel noteId={note.id} noteStatus={note.status} />
                                </TabsContent>

                                <TabsContent value="chat" className="m-0 min-h-0 flex-1 overflow-hidden p-0">
                                    <ChatInterface note={note} readOnly={readOnly} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

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
                            {isSavingDetails && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Zapisz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="flex h-[80vh] max-w-2xl flex-col">
                    <DialogHeader>
                        <DialogTitle>Dodaj pliki</DialogTitle>
                        <DialogDescription>
                            Prześlij dodatkowe pliki do tej notatki.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <NoteFileUpload files={newFiles} setFiles={setNewFiles} />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleSaveFiles}
                            disabled={isSavingFiles || newFiles.length === 0 || newFiles.some((file) => file.status === "uploading")}
                        >
                            {isSavingFiles && <Loader2 className="mr-2 size-4 animate-spin" />}
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
                        <Button variant="destructive" onClick={handleDeleteNote} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Usuwanie...
                                </>
                            ) : (
                                "Usuń"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
