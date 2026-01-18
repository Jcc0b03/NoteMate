import { Plus } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const NewNoteCard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            {...props}
            suppressHydrationWarning
            className={cn(
                "group h-full min-h-[300px] flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10 transition-all cursor-pointer bg-transparent",
                className
            )}
        >
            <div className="size-16 rounded-full bg-white dark:bg-card shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Plus className="size-8 text-blue-500" />
            </div>

            <h3 className="font-bold text-lg text-foreground mb-2 text-center">Dodaj nową notatkę</h3>
            <p className="text-muted-foreground text-sm text-center max-w-[200px] leading-relaxed">
                Prześlij zdjęcie lub plik PDF, a AI zajmie się resztą
            </p>
        </div>
    );
});
NewNoteCard.displayName = "NewNoteCard";
