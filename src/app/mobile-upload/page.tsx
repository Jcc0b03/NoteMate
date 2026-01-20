"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

function MobileUploadContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session");
    const [isMobile, setIsMobile] = useState<boolean>(true);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Simple user agent check
        const ua = navigator.userAgent;
        const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        setIsMobile(mobilePattern.test(ua));
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!sessionId) {
            setError("Invalid session. Please scan the QR code again.");
            return;
        }

        setUploading(true);
        setError(null);

        // Convert FileList to Array
        const files = Array.from(e.target.files);

        try {
            // Upload files sequentially or parallel. 
            // Vercel Blob limits might apply, but for a few photos parallel is usually fine.
            await Promise.all(
                files.map(async (file) => {
                    const formData = new FormData();
                    formData.append("file", file);

                    const response = await fetch(`/api/handoff/upload?sessionId=${sessionId}`, {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to upload ${file.name}`);
                    }
                })
            );

            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError("Failed to upload files. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (!isMobile) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="rounded-full bg-yellow-100 p-4 mb-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Desktop Device Detected</h1>
                <p className="mt-2 text-gray-600">
                    This page is designed for mobile devices. Please scan the QR code with your phone.
                </p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="rounded-full bg-green-100 p-4 mb-6 shadow-sm">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Success!</h1>
                <p className="mt-2 text-gray-600">
                    Your photos have been sent to your desktop. You can close this tab now.
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="border-b bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Mobile Handoff
                </h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900">Take a Photo</h2>
                    <p className="text-gray-500">
                        Snap a picture of your notes to instantly send them to your computer.
                    </p>
                </div>

                <div className="w-full max-w-sm">
                    <label
                        htmlFor="camera-input"
                        className={`
              relative flex flex-col items-center justify-center w-full aspect-[4/5] 
              border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 
              cursor-pointer hover:bg-gray-100 transition-colors active:scale-95 duration-200
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                                <span className="text-sm text-gray-500 font-medium">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="rounded-full bg-blue-100 p-4">
                                    <Upload className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-sm font-semibold text-gray-700">Tap to Capture</span>
                                    <span className="text-xs text-gray-500">Supports Multi-Upload</span>
                                </div>
                            </div>
                        )}

                        <input
                            id="camera-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 animate-in slide-in-from-bottom-2">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                    </div>
                )}

            </main>

            <footer className="p-6 text-center text-xs text-gray-400">
                Powered by Vercel Blob
            </footer>
        </div>
    );
}

export default function MobileUploadPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MobileUploadContent />
        </Suspense>
    );
}
