"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, CheckCircle, AlertTriangle, Loader2, Image as ImageIcon, Camera, Trash2, Send, X, Info } from "lucide-react";

// --- Utility: Client-Side Compression ---
const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) return file;

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            // Resize logic: Max 1920px (keep aspect ratio)
            const MAX_SIZE = 1920;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(file); // Fallback to original
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG 0.8 quality
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                },
                "image/jpeg",
                0.8
            );
        };

        img.onerror = () => resolve(file);
    });
};

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface StagedFile {
    id: string;
    file: File;
    preview: string;
    status: UploadStatus;
}

function MobileUploadContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session");

    // State
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' | 'info' } | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Refs for two different inputs
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Constants
    const MAX_FILES = 5;

    // Derived state
    const uploadCount = stagedFiles.filter(f => f.status === 'success').length;
    const totalFiles = stagedFiles.length;
    const allDone = totalFiles > 0 && uploadCount === totalFiles;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setGlobalError(null);
        setToast(null);

        const allFiles = Array.from(e.target.files);
        const remainingSlots = MAX_FILES - stagedFiles.length;

        // 1. Limit Check: Zero slots
        if (remainingSlots <= 0) {
            setToast({ msg: "Maksymalnie 5 zdjęć. Nie można dodać więcej.", type: 'error' });
            e.target.value = "";
            return;
        }

        // 2. Smart Limiting
        let filesToProcess = allFiles;
        if (allFiles.length > remainingSlots) {
            filesToProcess = allFiles.slice(0, remainingSlots);
            setToast({
                msg: `Maksymalnie 5 zdjęć. Dodano tylko ${remainingSlots} ${remainingSlots === 1 ? 'pierwsze zdjęcie' : (remainingSlots > 1 && remainingSlots < 5) ? 'pierwsze zdjęcia' : 'pierwszych zdjęć'}.`,
                type: 'info'
            });
        }

        setIsCompressing(true);

        const newStagedFiles: StagedFile[] = [];

        try {
            await Promise.all(
                filesToProcess.map(async (file) => {
                    // Compress client-side
                    const compressed = await compressImage(file);
                    newStagedFiles.push({
                        id: Math.random().toString(36).substring(7),
                        file: compressed,
                        preview: URL.createObjectURL(compressed),
                        status: 'pending'
                    });
                })
            );

            setStagedFiles((prev) => [...prev, ...newStagedFiles]);
        } catch (err) {
            console.error("Compression failed", err);
            setGlobalError("Nie udało się przetworzyć niektórych zdjęć. Spróbuj ponownie.");
        } finally {
            setIsCompressing(false);
            // Reset both inputs
            if (cameraInputRef.current) cameraInputRef.current.value = "";
            if (galleryInputRef.current) galleryInputRef.current.value = "";
        }
    };

    const removeFile = (id: string) => {
        if (isUploading) return;
        setStagedFiles((prev) => {
            const newFiles = prev.filter((f) => f.id !== id);
            const fileToRemove = prev.find((f) => f.id === id);
            if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
            return newFiles;
        });
        setGlobalError(null);
    };

    const startUploadQueue = async () => {
        if (!sessionId) {
            setGlobalError("Nieprawidłowa sesja. Zeskanuj kod QR ponownie.");
            return;
        }
        if (stagedFiles.length === 0) return;

        setIsUploading(true);
        setGlobalError(null);

        // Create a copy to iterate, but we update state by finding by ID
        // We only process 'pending' or 'error' files (retries)
        const queue = stagedFiles.filter(f => f.status === 'pending' || f.status === 'error');
        let uploadFailed = false;

        // Sequential Upload Strategy
        for (const item of queue) {
            try {
                // Update status to uploading
                setStagedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));

                const formData = new FormData();
                formData.append("file", item.file);

                const res = await fetch(`/api/handoff/upload?sessionId=${sessionId}`, {
                    method: "POST",
                    body: formData,
                    // valid for simple CORS/standard requests; ngrok header if needed
                    headers: new Headers({
                        "ngrok-skip-browser-warning": "69420",
                    }),
                });

                if (!res.ok) throw new Error("Upload failed");

                // Update status to success
                setStagedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'success' } : f));

            } catch (error) {
                uploadFailed = true;
                console.error(`Error uploading ${item.id}`, error);
                setStagedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
                // Optional: Stop on error? Or continue?
                // We'll continue trying the others.
            }
        }

        setIsUploading(false);

        // Keep the desktop session open when a file needs to be retried.
        if (uploadFailed) return;
        await fetch(`/api/handoff/complete?sessionId=${sessionId}`, {
            method: "POST",
            headers: new Headers({ "ngrok-skip-browser-warning": "69420" })
        });
    };

    // --- Success View ---
    if (allDone) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-green-50 p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="rounded-full bg-green-100 p-6 mb-6 shadow-sm">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Wysłano!</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Przesłano pomyślnie {uploadCount} {uploadCount === 1 ? 'zdjęcie' : (uploadCount > 1 && uploadCount < 5) ? 'zdjęcia' : 'zdjęć'} na Twój komputer.
                </p>
            </div>
        );
    }

    // --- Main View ---
    return (
        <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden text-gray-900">
            {/* Header */}
            <header className="flex-none bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <Upload className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-gray-900 tracking-tight">NoteMate Upload</span>
                </div>
                <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    {stagedFiles.length} / {MAX_FILES}
                </div>
            </header>

            {/* Error Banner */}
            {globalError && (
                <div className="flex-none bg-red-50 px-6 py-3 border-b border-red-100 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{globalError}</p>
                </div>
            )}

            {/* Main Content: Staging List */}
            <main className="flex-1 overflow-y-auto p-4 pb-32">
                {stagedFiles.length === 0 && !isCompressing ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <ImageIcon className="h-16 w-16 text-gray-300" />
                        <p className="text-gray-400 font-medium">Brak wybranych zdjęć</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {stagedFiles.map((item) => (
                            <div key={item.id} className="relative aspect-[3/4] bg-white rounded-xl shadow-sm border overflow-hidden group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item.preview}
                                    alt="Preview"
                                    className={`w-full h-full object-cover transition-opacity ${item.status === 'uploading' ? 'opacity-50' : 'opacity-100'}`}
                                />

                                {/* Status Overlays */}
                                {item.status === 'uploading' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                                    </div>
                                )}
                                {item.status === 'success' && (
                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                        <div className="bg-white rounded-full p-1 shadow-sm">
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                )}
                                {item.status === 'error' && (
                                    <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center">
                                        <AlertTriangle className="h-8 w-8 text-red-600" />
                                    </div>
                                )}

                                {/* Delete Button (only if not uploading) */}
                                {!isUploading && (
                                    <button
                                        onClick={() => removeFile(item.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full text-gray-500 hover:text-red-500 shadow-sm border border-gray-100 active:scale-95 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {isCompressing && (
                    <div className="mt-8 flex flex-col items-center justify-center animate-pulse">
                        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Kompresowanie zdjęć...</span>
                    </div>
                )}
            </main>

            {/* Bottom Actions */}
            <div className="flex-none bg-white border-t p-4 pb-8 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.05)] z-20">
                {!isUploading ? (
                    <div className="flex flex-col gap-3">
                        {/* Action Buttons Row */}
                        {stagedFiles.length < MAX_FILES && (
                            <div className="flex gap-3">
                                {/* Camera Button */}
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex-1 flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 text-blue-700 p-4 rounded-xl active:scale-[0.98] transition-all"
                                >
                                    <Camera className="h-6 w-6" />
                                    <span className="font-bold text-sm">Aparat</span>
                                </button>

                                {/* Gallery Button */}
                                <button
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="flex-1 flex flex-col items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-100 text-purple-700 p-4 rounded-xl active:scale-[0.98] transition-all"
                                >
                                    <ImageIcon className="h-6 w-6" />
                                    <span className="font-bold text-sm">Galeria</span>
                                </button>
                            </div>
                        )}

                        {/* Send Button */}
                        {stagedFiles.length > 0 && (
                            <button
                                onClick={startUploadQueue}
                                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <Send className="h-5 w-5" />
                                <span>Wyślij na komputer ({stagedFiles.length})</span>
                            </button>
                        )}
                    </div>
                ) : (
                    // Progress View
                    <div className="py-2 text-center">
                        <p className="text-gray-500 font-medium animate-pulse mb-2">
                            Wysyłanie {uploadCount + 1} z {totalFiles}...
                        </p>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                                style={{ width: `${(uploadCount / totalFiles) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Inputs */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />
            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90%] md:max-w-sm animate-in fade-in zoom-in slide-in-from-bottom-5 duration-300">
                    <div className={`px-4 py-3 rounded-xl shadow-lg border backdrop-blur items-center flex gap-3 ${toast.type === 'error' ? 'bg-red-900/90 text-red-50 border-red-800' : 'bg-gray-900/90 text-white border-gray-800'
                        }`}>
                        {toast.type === 'error' ? <AlertTriangle size={20} className="shrink-0" /> : <Info size={20} className="shrink-0" />}
                        <p className="text-sm font-medium flex-1">{toast.msg}</p>
                        <button onClick={() => setToast(null)}><X size={18} className="opacity-70 hover:opacity-100" /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MobileUploadPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
            <MobileUploadContent />
        </Suspense>
    );
}
