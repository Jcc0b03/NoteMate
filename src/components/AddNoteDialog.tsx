"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Upload, X, FileText, Image as ImageIcon, Smartphone, Trash2, Plus, Check, ChevronsUpDown, AlertCircle } from "lucide-react";
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
import { useDropzone } from "react-dropzone";
import { upload } from "@vercel/blob/client";

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

type FileUploadStatus = 'uploading' | 'completed' | 'error';

interface FileUpload {
    id: string;
    file: File;
    progress: number;
    status: FileUploadStatus;
    url?: string;
    error?: string;
}

export function AddNoteDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [subjects, setSubjects] = useState(frameworks);
    const [inputValue, setInputValue] = useState("");
    const [files, setFiles] = useState<FileUpload[]>([]);

    const handleCreateSubject = () => {
        if (!inputValue) return;
        const newSubject = { value: inputValue.toLowerCase(), label: inputValue };
        setSubjects([...subjects, newSubject]);
        setValue(newSubject.value);
        setOpen(false);
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
                const blob = await upload(fileUpload.file.name, fileUpload.file, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                    onUploadProgress: (progressEvent) => {
                        setFiles(prev => prev.map(f => {
                            if (f.id === fileUpload.id) {
                                return { ...f, progress: progressEvent.percentage };
                            }
                            return f;
                        }));
                    }
                });

                setFiles(prev => prev.map(f => {
                    if (f.id === fileUpload.id) {
                        return { ...f, status: 'completed', url: blob.url, progress: 100 };
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
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-background">
                <div className="p-6 pb-0">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold">Dodaj nową notatkę</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Left Column - Form */}
                        <div className="md:col-span-4 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-semibold">Tytuł notatki</Label>
                                <Input id="title" placeholder="np. Wykład z algebry" className="bg-muted/50" />
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
                                    <div className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                                        # Ważne
                                        <button className="hover:text-blue-900"><X className="size-3" /></button>
                                    </div>
                                    <div className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                                        # Egzamin
                                        <button className="hover:text-green-900"><X className="size-3" /></button>
                                    </div>
                                </div>
                                <Input placeholder="Dodaj tag..." className="bg-muted/50" />
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

                        {/* Right Column - Upload */}
                        <div className="md:col-span-8 flex flex-col h-full bg-muted/20 rounded-xl p-1">
                            <div className="flex-1 p-5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h3 className="font-semibold">Pliki</h3>
                                        <p className="text-xs text-muted-foreground">Prześlij zdjęcia lub skany notatek</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                                        <Smartphone className="size-3.5" />
                                        Prześlij z telefonu
                                    </Button>
                                </div>

                                {/* Dropzone */}
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed border-primary/20 bg-blue-50/30 dark:bg-blue-900/5 rounded-xl h-48 flex flex-col items-center justify-center text-center gap-4 transition-colors hover:border-primary/40 hover:bg-blue-50/50 cursor-pointer",
                                        isDragActive && "border-primary bg-blue-50/50"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <div className="size-12 rounded-full bg-white dark:bg-card shadow-sm flex items-center justify-center text-primary">
                                        <Upload className="size-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-sm">
                                            {isDragActive ? "Upuść pliki tutaj..." : "Upuść notatki tutaj"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">lub kliknij, aby przeglądać pliki</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><FileText className="size-3" /> JPG, PNG</span>
                                        <span className="flex items-center gap-1"><FileText className="size-3" /> PDF</span>
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
                                            <div key={file.id} className="bg-white dark:bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                                                <div className={cn(
                                                    "size-10 rounded-lg flex items-center justify-center shrink-0",
                                                    file.status === 'error' ? "bg-red-100 text-red-600" :
                                                        file.status === 'completed' ? "bg-green-100 text-green-600" :
                                                            "bg-blue-100 text-blue-600"
                                                )}>
                                                    {file.status === 'error' ? <AlertCircle className="size-5" /> :
                                                        file.file.type.includes('image') ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-medium truncate" title={file.file.name}>{file.file.name}</p>
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 text-xs font-semibold",
                                                            file.status === 'error' ? "text-red-600" :
                                                                file.status === 'completed' ? "text-green-600" :
                                                                    "text-blue-600"
                                                        )}>
                                                            {file.status === 'completed' && <div className="size-1.5 rounded-full bg-green-600" />}
                                                            {file.status === 'completed' ? "Gotowe" :
                                                                file.status === 'error' ? "Błąd" :
                                                                    "Wysyłanie..."}
                                                        </div>
                                                    </div>
                                                    {file.status !== 'error' && (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <Progress
                                                                value={file.progress}
                                                                className={cn(
                                                                    "h-1",
                                                                    file.status === 'completed' ? "bg-green-100 [&>div]:bg-green-500" : "bg-blue-100 [&>div]:bg-blue-500"
                                                                )}
                                                            />
                                                            <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(file.progress)}%</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                                                        <span>{formatFileSize(file.file.size)}</span>
                                                        {file.error && <span className="text-red-500">{file.error}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                >
                                                    {file.status === 'uploading' ? <X className="size-4" /> : <Trash2 className="size-4" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border mt-6 flex items-center justify-end gap-3 bg-muted/10">
                    <Button variant="ghost">Anuluj</Button>
                    <Button
                        disabled={files.some(f => f.status === 'uploading')}
                        className="bg-blue-500 hover:bg-blue-600 text-white gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Sparkles className="size-4" />
                        Przetwórz i Zapisz
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
