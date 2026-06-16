import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
    title: string;
    updatedAt?: string;
    children: React.ReactNode;
}

export function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Top bar */}
            <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                            <BookOpen className="size-4" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Notemate</span>
                    </Link>
                    <Link
                        href="/"
                        className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Strona główna
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
                {updatedAt && (
                    <p className="mt-2 text-sm text-slate-500">Ostatnia aktualizacja: {updatedAt}</p>
                )}

                <article className="prose prose-slate max-w-none mt-8 prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                    {children}
                </article>

                {/* Footer nav */}
                <footer className="mt-16 border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} Notemate</p>
                    <nav className="flex gap-6">
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">Prywatność</Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">Regulamin</Link>
                        <Link href="/help" className="hover:text-blue-600 transition-colors">Pomoc</Link>
                    </nav>
                </footer>
            </main>
        </div>
    );
}
