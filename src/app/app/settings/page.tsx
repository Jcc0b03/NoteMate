"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-1">Profile Information</h2>
                        <p className="text-muted-foreground text-sm">Update your account details and preferences.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Display Name</label>
                            <input type="text" defaultValue="John Doe" className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <input type="email" defaultValue="john@example.com" className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
