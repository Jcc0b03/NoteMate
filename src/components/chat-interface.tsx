"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Bot, User, Paperclip } from "lucide-react";
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ... imports ...

interface ChatInterfaceProps {
    note: {
        id: string;
        title: string | null;
        files: any[];
    };
    readOnly?: boolean;
}

export function ChatInterface({ note, readOnly = false }: ChatInterfaceProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');

    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/ai/chat',
            body: {
                noteId: note.id
            }
        }),
    });

    useEffect(() => {
        fetch(`/api/ai/chat?noteId=${note.id}`)
            .then(res => res.json())
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setMessages(data.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        parts: [{ type: 'text', text: m.content }]
                    })));
                }
            })
            .catch(err => console.error("Failed to load chat history", err));
    }, [note.id, setMessages]);

    const isLoading = status === 'submitted' || status === 'streaming';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        await sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: input }],
        });
        setInput('');
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur shrink-0">
                <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    Asystent AI
                </h1>

            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                        <Bot className="w-12 h-12 mb-2 opacity-20" />
                        <p>Zadaj pytanie dotyczące twojej notatki.</p>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role !== 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        )}

                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-tl-none'
                            }`}>
                            <div className={`prose max-w-none text-sm leading-relaxed prose-p:my-1 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-pre:border dark:prose-pre:border-zinc-700 ${m.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                                {m.parts
                                    ? m.parts.map((part, i) => {
                                        if (part.type === 'text') {
                                            return (
                                                <ReactMarkdown
                                                    key={i}
                                                    remarkPlugins={[remarkGfm]}
                                                >
                                                    {part.text}
                                                </ReactMarkdown>
                                            );
                                        }
                                        return null;
                                    })
                                    : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {(m as any).content}
                                        </ReactMarkdown>
                                    )
                                }
                            </div>
                        </div>

                        {m.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            {!readOnly ? (
                <div className="p-4 bg-white dark:bg-zinc-950 border-t dark:border-zinc-800 shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2 relative">
                        <input
                            className="flex-1 p-3 pl-4 pr-12 rounded-xl border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Napisz wiadomość..."
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t dark:border-zinc-800 shrink-0">
                    <p className="text-center text-sm text-muted-foreground">
                        Możliwość pisania jest zablokowana w trybie podglądu.
                    </p>
                </div>
            )}
        </div>
    );
}
