import Link from "next/link";
import { CalendarClock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Plan Nauki | NoteMate",
};

export default function PlanPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
                    Plan Nauki
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Twój spersonalizowany harmonogram powtórek.
                </p>
            </div>

            <div className="bg-white dark:bg-card rounded-3xl p-10 shadow-sm border border-border flex flex-col items-center text-center gap-4">
                <div className="size-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CalendarClock className="size-8" />
                </div>
                <h2 className="text-xl font-bold text-blue-950 dark:text-blue-50">
                    Inteligentny plan powtórek już wkrótce
                </h2>
                <p className="text-muted-foreground max-w-md">
                    Wkrótce NoteMate zaproponuje, które notatki warto powtórzyć i kiedy, w oparciu o
                    metodę powtórek rozłożonych w czasie. Na razie dodawaj notatki i rozmawiaj z nimi
                    z pomocą Asystenta AI.
                </p>
                <Link href="/app/new">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl gap-2 mt-2">
                        <Sparkles className="size-4" />
                        Dodaj notatkę
                    </Button>
                </Link>
            </div>
        </div>
    );
}
