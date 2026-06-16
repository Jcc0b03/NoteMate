import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";

export const metadata = {
    title: "Ustawienia | NoteMate",
};

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/app"
                    className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Powrót do panelu"
                >
                    <ArrowLeft className="size-5" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
                        Ustawienia
                    </h1>
                    <p className="text-muted-foreground">
                        Zarządzaj swoim profilem, adresem e-mail i bezpieczeństwem konta.
                    </p>
                </div>
            </div>

            <div className="flex justify-center">
                <UserProfile
                    routing="hash"
                    appearance={{
                        elements: {
                            rootBox: "w-full flex justify-center",
                            cardBox: "w-full max-w-3xl shadow-sm border border-border rounded-2xl",
                        },
                    }}
                />
            </div>
        </div>
    );
}
