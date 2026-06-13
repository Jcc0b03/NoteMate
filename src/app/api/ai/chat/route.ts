import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import type { FilePart, ModelMessage, UIMessage } from 'ai';
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const maxDuration = 60;
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

type IncomingTextPart = {
    type: 'text';
    text: string;
};

type IncomingMessage = {
    role: UIMessage['role'];
    content?: string;
    parts?: IncomingTextPart[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isIncomingTextPart(value: unknown): value is IncomingTextPart {
    return isRecord(value) && value.type === 'text' && typeof value.text === 'string';
}

function normalizeMessages(value: unknown): IncomingMessage[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((message) => {
        if (!isRecord(message)) return [];
        if (message.role !== 'system' && message.role !== 'user' && message.role !== 'assistant') return [];

        const content = typeof message.content === 'string' ? message.content : undefined;
        const parts = Array.isArray(message.parts) ? message.parts.filter(isIncomingTextPart) : [];

        return [{
            role: message.role,
            content,
            parts: parts.length > 0 ? parts : content ? [{ type: 'text' as const, text: content }] : [],
        }];
    });
}

function getMessageText(message: IncomingMessage) {
    if (message.content) return message.content;
    return message.parts?.map((part) => part.text).join('') || '';
}

async function getAccessibleNote(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { files: true }
    });

    if (!note) {
        return { note: null, response: new Response('Note not found', { status: 404 }) };
    }

    const canRead = note.userId === userId || note.sharedWith.includes(userId) || note.isShared;

    if (!canRead) {
        return { note: null, response: new Response('Forbidden', { status: 403 }) };
    }

    return { note, response: null };
}

function canWriteChat(note: NonNullable<Awaited<ReturnType<typeof getAccessibleNote>>['note']>, userId: string) {
    return note.userId === userId || note.sharedWith.includes(userId) || (note.isShared && note.isPublicEditable);
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');
    const user = await currentUser();

    if (!noteId) {
        return new Response('Missing noteId', { status: 400 });
    }

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const access = await getAccessibleNote(noteId, user.id);
    if (access.response) return access.response;

    const messages = await prisma.message.findMany({
        where: { noteId },
        orderBy: { createdAt: 'asc' },
    });

    return Response.json(messages);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const noteId = isRecord(body) && typeof body.noteId === 'string' ? body.noteId : '';
        const messages = isRecord(body) ? normalizeMessages(body.messages) : [];
        const user = await currentUser();

        if (!noteId) {
            return new Response('Missing noteId', { status: 400 });
        }

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const access = await getAccessibleNote(noteId, user.id);
        if (access.response) return access.response;

        if (!canWriteChat(access.note, user.id)) {
            return new Response('Chat is read-only for this note', { status: 403 });
        }

        // Save User Message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            const content = getMessageText(lastMessage);

            await prisma.message.create({
                data: {
                    noteId,
                    role: 'user',
                    content: content || ''
                }
            });
        }

        // 1. Pobranie plików z bazy
        const files = access.note.files;

        // 2. Upload do Google File API
        const googleFiles = await Promise.all(files.map(async (file) => {
            const response = await fetch(file.url);
            const buffer = Buffer.from(await response.arrayBuffer());
            const tempPath = path.join(os.tmpdir(), `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`);

            await fs.writeFile(tempPath, buffer);
            const upload = await fileManager.uploadFile(tempPath, {
                mimeType: file.type,
                displayName: file.name,
            });
            await fs.unlink(tempPath);

            let status = await fileManager.getFile(upload.file.name);
            while (status.state === FileState.PROCESSING) {
                await new Promise(r => setTimeout(r, 1000));
                status = await fileManager.getFile(upload.file.name);
            }
            return upload.file;
        }));

        // 3. Przygotowanie historii wiadomości
        const uiMessages: Array<Omit<UIMessage, 'id'>> = messages.map(({ role, parts }) => ({
            role,
            parts: parts || [],
        }));
        const coreMessages = await convertToModelMessages(uiMessages);

        // 4. Dołączenie plików do ostatniej wiadomości użytkownika
        const lastMessageIndex = coreMessages.length - 1;
        if (lastMessageIndex >= 0 && coreMessages[lastMessageIndex].role === 'user' && googleFiles.length > 0) {
            const lastCoreMessage = coreMessages[lastMessageIndex];
            const fileParts: FilePart[] = googleFiles.map(f => ({
                type: 'file',
                data: f.uri,
                mediaType: f.mimeType || 'application/octet-stream'
            }));

            if (typeof lastCoreMessage.content === 'string') {
                coreMessages[lastMessageIndex] = {
                    ...lastCoreMessage,
                    content: [{ type: 'text', text: lastCoreMessage.content }, ...fileParts]
                } as ModelMessage;
            } else if (Array.isArray(lastCoreMessage.content)) {
                coreMessages[lastMessageIndex] = {
                    ...lastCoreMessage,
                    content: [...lastCoreMessage.content, ...fileParts]
                } as ModelMessage;
            }
        }

        // 5. Wywołanie streamingu z historią
        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: 'Jesteś pomocnym asystentem, który analizuje załączone pliki.',
            messages: coreMessages,
            onFinish: async ({ text }) => {
                // Save Assistant Message
                await prisma.message.create({
                    data: {
                        noteId,
                        role: 'assistant',
                        content: text
                    }
                });
            },
        });

        // 6. Zwrócenie strumienia do frontendu
        return result.toUIMessageStreamResponse();

    } catch (error: unknown) {
        console.error("BŁĄD SERWERA:", error);
        const message = error instanceof Error ? error.message : 'Unknown server error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
