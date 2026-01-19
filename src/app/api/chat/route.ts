import { streamText, tool } from 'ai';
import { getAIProvider } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { messages, noteId } = await req.json();

  if (!noteId) return new Response('Note ID required', { status: 400 });

  const note = await prisma.note.findUnique({
    where: {
        id: noteId,
        OR: [
            { userId: user.id },
            { sharedWith: { has: user.id } }
        ]
    },
  });

  if (!note) return new Response('Note not found', { status: 404 });

  const provider = getAIProvider();

  const systemPrompt = `You are a helpful AI assistant. You have access to the user's note content.

  Note Title: ${note.title}

  Note Content:
  ${note.content || "Content not processed yet."}

  Summary:
  ${note.summary || "No summary available."}

  Answer the user's questions based on this content.
  If the user explicitly asks for a quiz, use the generateQuiz tool.
  `;

  const result = streamText({
    model: provider.getModel(),
    system: systemPrompt,
    messages,
    tools: {
      generateQuiz: tool({
        description: 'Generates a quiz based on the note content. Use this when the user asks for a quiz.',
        parameters: z.object({}),
        execute: async () => {
             const quiz = await provider.generateQuiz(note.content || "");
             return quiz;
        },
      }),
    },
    // @ts-ignore
    maxSteps: 5,
    onFinish: async ({ text, toolCalls, toolResults }) => {
        // Save the conversation to DB
        // 1. Save the last user message (assuming it wasn't saved yet - standard stateless API pattern)
        // Actually, we should iterate and save, but usually we just save the new exchange.
        // The client sends full history. We only want to append the new stuff.
        // But how do we know what is new?
        // Simplest: The UI is responsible for fetching history on load, and this API just answers.
        // But if we want persistence, we must save.

        // Let's assume the last message in `messages` is the user's new message.
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            await prisma.message.create({
                data: {
                    noteId,
                    role: 'user',
                    content: lastUserMessage.content
                }
            });
        }

        // 2. Save the assistant response
        // If there were tool calls (quiz), the text might be empty or contain the response to the tool result.
        // If tool was called, we might want to save the generated quiz as the content.
        // The `text` usually contains the final response.
        if (text) {
             await prisma.message.create({
                data: {
                    noteId,
                    role: 'assistant',
                    content: text
                }
            });
        } else if (toolResults && toolResults.length > 0) {
            // If quiz was generated via tool, we might want to save the result.
            // But the user said "skip saving quizzes". So maybe we don't save this message?
            // Or we save it as text if the model outputs it.
            // If the model consumes the tool output and says "Here is your quiz...", `text` will be populated.
            // So relying on `text` is safe.
        }
    }
  });

  return (result as any).toDataStreamResponse();
}
