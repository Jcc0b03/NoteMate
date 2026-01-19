import { getNote } from "@/app/actions";
import { notFound } from "next/navigation";
import { formatRelativeTime, getColorForSubject } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, MessageSquare, Bot } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const note = await getNote(id);

    if (!note) {
        notFound();
    }

    const subjectColor = getColorForSubject(note.subject?.name || null);
    const colorClasses = {
        blue: "bg-blue-100 text-blue-700",
        green: "bg-green-100 text-green-700",
        orange: "bg-orange-100 text-orange-700",
        purple: "bg-purple-100 text-purple-700",
    }[subjectColor] || "bg-gray-100 text-gray-700";

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-full gap-6">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/app/notes">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-blue-50">
                            {note.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colorClasses}`}>
                                {note.subject?.name || "Ogólne"}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                                {formatRelativeTime(note.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" />
                        Eksportuj
                    </Button>
                </div>
            </div>

            {/* Main Content - Split Screen */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

                {/* Left Column: Content & Files */}
                <div className="flex flex-col gap-6 overflow-hidden">
                    {/* Files Section */}
                    {note.files.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-2 shrink-0 scrollbar-thin">
                            {note.files.map((file) => (
                                <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-card border border-border rounded-xl min-w-[200px] hover:border-blue-300 transition-colors"
                                >
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                        <FileText className="size-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Text Content */}
                    <ScrollArea className="flex-1 bg-white dark:bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <div className="prose prose-blue dark:prose-invert max-w-none">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Bot className="size-5 text-blue-500" />
                                Podsumowanie AI
                            </h3>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-sm leading-relaxed text-blue-900 dark:text-blue-100 mb-8 border border-blue-100 dark:border-blue-900/20">
                                {note.summary || "Generowanie podsumowania..."}
                            </div>

                            <Separator className="my-6" />

                            <h3 className="text-lg font-bold mb-4">Pełna Transkrypcja</h3>
                            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                {note.content || "Brak treści. Prześlij plik, aby wygenerować transkrypcję."}
                            </p>
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Column: Chat */}
                <div className="flex flex-col bg-white dark:bg-card border border-border rounded-3xl shadow-sm overflow-hidden h-[600px] lg:h-auto">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                            <MessageSquare className="size-4 text-blue-500" />
                            Czat z notatką
                        </div>
                        <span className="text-xs text-muted-foreground">GPT-4o</span>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {note.messages.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    <p>Zadaj pytanie dotyczące tej notatki.</p>
                                    <p className="text-xs mt-1 opacity-70">&quot;Jaka jest główna teza?&quot;</p>
                                </div>
                            ) : (
                                note.messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <Avatar className="size-8 mt-1">
                                            <AvatarFallback className={msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                                                {msg.role === 'user' ? 'TY' : 'AI'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={`rounded-2xl p-3 text-sm max-w-[80%] ${
                                            msg.role === 'user'
                                                ? 'bg-blue-500 text-white rounded-tr-sm'
                                                : 'bg-muted text-foreground rounded-tl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-border bg-muted/20">
                        <form className="relative">
                            <input
                                type="text"
                                placeholder="Zapytaj o treść..."
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-white dark:bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                            />
                            <Button size="icon" className="absolute right-1.5 top-1.5 size-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-none">
                                <ArrowLeft className="size-4 rotate-90" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
