"use client";

import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Image as ImageIcon, Smartphone, Trash2, Check, AlertCircle } from "lucide-react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { MobileHandoffButton, type HandoffFile } from "@/components/MobileHandoffButton";

export type FileUploadStatus = 'uploading' | 'complete' | 'error';

export interface Filelike {
    name: string;
    size: number;
    type: string;
}

export interface FileUpload {
    id: string;
    file: File | Filelike;
    progress: number;
    status: FileUploadStatus;
    url?: string;
    error?: string;
}

interface NoteFileUploadProps {
    files: FileUpload[];
    setFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>;
}

export function NoteFileUpload({ files, setFiles }: NoteFileUploadProps) {
    const handleMobileUpload = (blobs: HandoffFile[]) => {
        const newFiles: FileUpload[] = blobs.map(blob => ({
            id: Math.random().toString(36).substring(7),
            file: {
                name: blob.name,
                size: blob.size,
                type: blob.type
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
                const filename = fileUpload.file.name;
                const formData = new FormData();
                formData.append('file', fileUpload.file as File);
                formData.append('filename', filename);

                // Simulate progress
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
    }, [setFiles]);

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

    return (
        <div className="h-full flex flex-col">
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
    );
}
