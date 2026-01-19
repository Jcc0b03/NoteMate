"use client";

import { createNote } from "@/actions/note";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Upload, X, FileText, Image as ImageIcon, Smartphone, Trash2, Plus, Check, ChevronsUpDown, ArrowLeft, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { MobileHandoffButton } from "@/components/MobileHandoffButton";

const frameworks = [
    {
        value: "math",
        label: "Matematyka",
    },
    {
        value: "physics",
        label: "Fizyka",
    },
    {
        value: "history",
        label: "Historia",
    },
    {
        value: "biology",
        label: "Biologia",
    },
];

type FileUploadStatus = 'uploading' | 'complete' | 'error';

interface Filelike {
    name: string;
    size: number;
    type: string;
}

interface FileUpload {
    id: string;
    file: File | Filelike;
    progress: number;
    status: FileUploadStatus;
    url?: string;
    error?: string;
}

export default function NewNotePage() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [subjects, setSubjects] = useState(frameworks);
    const [inputValue, setInputValue] = useState("");

    const [files, setFiles] = useState<FileUpload[]>([]);
    const [tags, setTags] = useState<string[]>(["Ważne", "Egzamin"]);
    const [tagInput, setTagInput] = useState("");

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleMobileUpload = (blobs: any[]) => {
        const newFiles: FileUpload[] = blobs.map(blob => ({
            id: Math.random().toString(36).substring(7),
            file: {
                name: blob.pathname.split('/').pop() || 'mobile-upload.jpg',
                size: blob.size,
                type: 'image/jpeg' // Default assumption or infer from ext
            },
            progress: 100,
            status: 'complete',
            url: blob.url
        }));

        setFiles(prev => [...prev, ...newFiles]);
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newFiles: FileUpload[] = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            progress: 0,
            status: 'uploading'
        }));

        setFiles(prev => [...prev, ...newFiles]);

        for (const fileUpload of newFiles) {
            try {
                // Determine file name
                const filename = fileUpload.file.name;

                const formData = new FormData();
                // We know it's a File here because it came from onDrop
                formData.append('file', fileUpload.file as File);
                formData.append('filename', filename);

                // Simulate progress since fetch doesn't support it easily
                setFiles(prev => prev.map(f => {
                    if (f.id === fileUpload.id) {
                        return { ...f, progress: 50 };
                    }
                    return f;
                }));

                const response = await fetch('/api/upload-private', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const blob = await response.json();

                setFiles(prev => prev.map(f => {
                    if (f.id === fileUpload.id) {
                        return { ...f, status: 'complete', url: blob.url, progress: 100 };
                    }
                    return f;
                }));
            } catch (error) {
                console.error("Upload error:", error);
                setFiles(prev => prev.map(f => {
                    if (f.id === fileUpload.id) {
                        return { ...f, status: 'error', error: 'Upload failed' };
                    }
                    return f;
                }));
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf']
        },
        maxSize: 10 * 1024 * 1024 // 10MB
    });

    const removeFile = async (id: string) => {
        const fileToRemove = files.find(f => f.id === id);
        if (fileToRemove?.url) {
            try {
                await fetch('/api/upload', {
                    method: 'DELETE',
                    body: JSON.stringify({ url: fileToRemove.url }),
                });
            } catch (error) {
                console.error("Failed to delete file:", error);
            }
        }
        setFiles(files.filter(f => f.id !== id));
    };

    const handleCreateSubject = () => {
        if (!inputValue) return;
        const newSubject = { value: inputValue.toLowerCase(), label: inputValue };
        setSubjects([...subjects, newSubject]);
        setValue(newSubject.value);
        setOpen(false);
    };

    const [title, setTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (files.length === 0) return;
        setIsSaving(true);
        try {
            // Determine subject name
            let subjectName = "";
            if (value) {
                const selected = subjects.find(s => s.value === value);
                subjectName = selected ? selected.label : value;
            }

            await createNote({
                title,
                subjectName,
                tags,
                files: files.map(f => ({
                    url: f.url!,
                    name: f.file.name,
                    type: f.file.type || 'unknown',
                    size: f.file.size
                })),
            });
            router.push("/app");
        } catch (error) {
            console.error("Failed to save note:", error);
            // You might want to show a toast here
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 hover:bg-muted/50 rounded-full transition-colors"
                        >
                            <ArrowLeft className="size-6 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Dodaj nową notatkę</h1>
                            <p className="text-muted-foreground">Prześlij materiały, a my zajmiemy się resztą.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column - Form Card */}
                        <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-semibold">Tytuł notatki</Label>
                                <Input
                                    id="title"
                                    placeholder="np. Wykład z algebry"
                                    className="bg-muted/50"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold">Przedmiot</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between bg-muted/50 font-normal hover:bg-muted/70"
                                        >
                                            {value
                                                ? subjects.find((subject) => subject.value === value)?.label
                                                : "Wybierz przedmiot..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Szukaj przedmiotu..."
                                                onValueChange={setInputValue}
                                            />
                                            <CommandList>
                                                <CommandEmpty className="py-2 px-2">
                                                    <p className="text-sm text-muted-foreground mb-2 px-2">Nie znaleziono przedmiotu.</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full justify-start gap-2"
                                                        onClick={handleCreateSubject}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Dodaj "{inputValue}"
                                                    </Button>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {subjects.map((subject) => (
                                                        <CommandItem
                                                            key={subject.value}
                                                            value={subject.value}
                                                            onSelect={(currentValue) => {
                                                                setValue(currentValue === value ? "" : currentValue);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    value === subject.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {subject.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold">Tagi</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag, index) => (
                                        <div
                                            key={tag}
                                            className={cn(
                                                "text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1",
                                                index % 2 === 0
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                            )}
                                        >
                                            # {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className={cn(
                                                    "hover:opacity-75 transition-opacity",
                                                    index % 2 === 0 ? "hover:text-blue-900" : "hover:text-green-900"
                                                )}
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Dodaj tag i naciśnij Enter..."
                                    className="bg-muted/50"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </div>

                            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4 flex gap-3">
                                <Sparkles className="size-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">Wskazówka AI</h4>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                                        Notemate automatycznie wykryje daty i definicje z Twoich notatek, aby utworzyć fiszki do nauki.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Upload Card */}
                        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="space-y-0.5">
                                    <h3 className="font-semibold">Pliki</h3>
                                    <p className="text-xs text-muted-foreground">Prześlij zdjęcia lub skany notatek</p>
                                </div>
                                <MobileHandoffButton
                                    onUpload={handleMobileUpload}
                                    className="h-8 gap-2 text-xs"
                                >
                                    <Smartphone className="size-3.5" />
                                    Prześlij z telefonu
                                </MobileHandoffButton>
                            </div>

                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-center gap-4 transition-all cursor-pointer mb-6",
                                    isDragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-primary/20 bg-blue-50/30 dark:bg-blue-900/5 hover:border-primary/40 hover:bg-blue-50/50"
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className="size-14 rounded-full bg-white dark:bg-card shadow-sm flex items-center justify-center text-primary">
                                    <Upload className="size-7" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-base">
                                        {isDragActive ? "Upuść pliki tutaj..." : "Upuść notatki tutaj"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">lub kliknij, aby przeglądać pliki</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><FileText className="size-3.5" /> JPG, PNG</span>
                                    <span className="flex items-center gap-1.5"><FileText className="size-3.5" /> PDF</span>
                                    <span>MAX 10 MB</span>
                                </div>
                            </div>

                            {/* File List */}
                            {files.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Przesyłanie ({files.length})
                                    </h4>

                                    {files.map((file) => (
                                        <div key={file.id} className="bg-white dark:bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center gap-4">
                                            <div className={cn(
                                                "size-12 rounded-xl flex items-center justify-center shrink-0",
                                                file.status === 'complete' ? "bg-green-100 text-green-600" :
                                                    file.status === 'error' ? "bg-red-100 text-red-600" :
                                                        "bg-blue-100 text-blue-600"
                                            )}>
                                                {file.status === 'error' ? <AlertCircle className="size-6" /> :
                                                    file.file.name.endsWith('.pdf') ? <FileText className="size-6" /> : <ImageIcon className="size-6" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-sm font-semibold truncate" title={file.file.name}>{file.file.name}</p>
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-xs font-bold",
                                                        file.status === 'complete' ? "text-green-600" :
                                                            file.status === 'error' ? "text-red-600" :
                                                                "text-blue-600"
                                                    )}>
                                                        {file.status === 'complete' ? (
                                                            <>
                                                                <Check className="size-3.5" />
                                                                Gotowe
                                                            </>
                                                        ) : file.status === 'error' ? (
                                                            "Błąd"
                                                        ) : (
                                                            "Wysyłanie..."
                                                        )}
                                                    </div>
                                                </div>
                                                {file.status !== 'error' && (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <Progress
                                                            value={file.progress}
                                                            className={cn(
                                                                "h-1.5",
                                                                file.status === 'complete' ? "bg-green-100 [&>div]:bg-green-500" : "bg-blue-100 [&>div]:bg-blue-500"
                                                            )}
                                                        />
                                                        <span className="text-xs text-muted-foreground tabular-nums font-medium">{Math.round(file.progress)}%</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                                                    <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    {file.error && <span className="text-red-500 ml-2">{file.error}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-muted rounded-lg"
                                            >
                                                {file.status === 'uploading' ? <X className="size-4.5" /> : <Trash2 className="size-4.5" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                            Anuluj
                        </Button>
                        <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-6 h-11"
                            disabled={files.some(f => f.status === 'uploading') || files.length === 0 || isSaving}
                            onClick={handleSave}
                        >
                            <Sparkles className="size-4" />
                            {isSaving ? "Zapisywanie..." : "Przetwórz i Zapisz"}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
