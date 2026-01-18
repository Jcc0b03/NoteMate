import { MessageSquare, Sparkles, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NoteCard({ title, preview, date, tag, color }: { title: string; preview: string; date: string; tag: string; color: string }) {
    // Color mapping for the left border and tag
    const colorStyles: Record<string, { border: string; bg: string; text: string }> = {
        blue: { border: "bg-blue-500", bg: "bg-blue-100", text: "text-blue-700" },
        green: { border: "bg-green-500", bg: "bg-green-100", text: "text-green-700" },
        orange: { border: "bg-orange-500", bg: "bg-orange-100", text: "text-orange-700" },
        purple: { border: "bg-purple-500", bg: "bg-purple-100", text: "text-purple-700" },
    };

    const currentStyle = colorStyles[color] || colorStyles.blue;

    return (
        <div className="relative group rounded-3xl bg-card shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-border">
            {/* Left color strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${currentStyle.border}`} />

            <div className="p-5 pl-7 flex flex-col gap-4 h-full">
                {/* Preview Illustration Area */}
                <div className="bg-muted/30 rounded-2xl p-4 relative min-h-[140px]">
                    {/* "Done" Badge */}
                    <div className="absolute top-3 right-3 bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="size-3" />
                        <span>Gotowe</span>
                    </div>

                    {/* Content Skeleton Representation */}
                    <div className="space-y-2 mt-2">
                        <div className="h-2 w-3/4 bg-muted/40 rounded-full" />
                        <div className="h-2 w-full bg-muted/40 rounded-full" />
                        <div className="h-2 w-5/6 bg-muted/40 rounded-full" />
                        <div className="h-2 w-4/5 bg-muted/40 rounded-full" />
                    </div>

                    {/* Circle placeholders */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="size-8 rounded-full border border-muted/40" />
                        <div className="size-8 rounded-full border border-muted/40" />
                    </div>
                </div>

                {/* Text Content */}
                <div>
                    <h3 className="font-bold text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2 leading-relaxed">{preview}</p>
                </div>

                {/* Meta Tags Row */}
                <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${currentStyle.bg} ${currentStyle.text}`}>
                        {tag}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{date}</span>
                </div>

                {/* Footer Separator */}
                <div className="h-px w-full bg-border/50 my-1" />

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-auto">
                    <Avatar className="size-8 bg-purple-100 text-purple-600">
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-bold text-xs">JD</AvatarFallback>
                    </Avatar>

                    <div className="flex items-center gap-1">
                        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full">
                            <Share2 className="size-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-full">
                            <MessageSquare className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
