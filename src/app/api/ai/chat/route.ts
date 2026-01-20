import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
        return new Response('Missing noteId', { status: 400 });
    }

    const messages = await prisma.message.findMany({
        where: { noteId },
        orderBy: { createdAt: 'asc' },
    });

    return Response.json(messages);
}

export async function POST(req: Request) {
    try {
        const { messages, noteId } = await req.json();

        // Save User Message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
            // Extract content from parts if it's not a direct string
            let content = lastMessage.content;
            if (!content && lastMessage.parts) {
                content = lastMessage.parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('');
            }

            await prisma.message.create({
                data: {
                    noteId,
                    role: 'user',
                    content: content || ''
                }
            });
        }

        // 1. Pobranie plików z bazy
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: { files: true }
        });

        const files = note?.files || [];

        // 2. Upload do Google File API
        const googleFiles = await Promise.all(files.map(async (file: any) => {
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
        const coreMessages = await convertToModelMessages(messages);

        // 4. Dołączenie plików do ostatniej wiadomości użytkownika
        const lastMessageIndex = coreMessages.length - 1;
        if (lastMessageIndex >= 0 && coreMessages[lastMessageIndex].role === 'user' && googleFiles.length > 0) {
            const lastCoreMessage = coreMessages[lastMessageIndex];

            let newContent: any[] = [];
            if (typeof lastCoreMessage.content === 'string') {
                newContent = [{ type: 'text', text: lastCoreMessage.content }];
            } else if (Array.isArray(lastCoreMessage.content)) {
                newContent = [...lastCoreMessage.content];
            }

            const fileParts = googleFiles.map(f => ({
                type: 'file',
                data: f.uri,
                mediaType: f.mimeType
            }));

            newContent.push(...fileParts);

            coreMessages[lastMessageIndex] = {
                ...lastCoreMessage,
                content: newContent as any
            };
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

    } catch (error: any) {
        console.error("BŁĄD SERWERA:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
