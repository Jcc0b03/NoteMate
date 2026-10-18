import { google } from "@ai-sdk/google";
import { generateObject, jsonSchema } from "ai";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { HttpError } from "@/lib/http-error";
import { readStoredFileBytes } from "@/lib/file-storage";

export interface NoteAnalysis {
    summary: string;
    content: string;
}

const noteAnalysisSchema = jsonSchema<NoteAnalysis>({
    type: "object",
    properties: {
        summary: {
            type: "string",
            description:
                "Zwięzłe, uporządkowane podsumowanie najważniejszych zagadnień, definicji i wniosków z notatek. Po polsku, w formacie Markdown (nagłówki, listy).",
        },
        content: {
            type: "string",
            description:
                "Pełna transkrypcja (OCR) całej treści widocznej na wszystkich załączonych plikach. Po polsku, z zachowaniem struktury.",
        },
    },
    required: ["summary", "content"],
    additionalProperties: false,
});

interface ProcessNoteOptions {
    userId?: string;
    requireOwner?: boolean;
}

export async function processNoteWithAi(noteId: string, options: ProcessNoteOptions = {}) {
    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { files: { orderBy: { createdAt: "asc" } } },
    });

    if (!note) {
        throw new HttpError(404, "Note not found");
    }

    if (options.userId && options.requireOwner !== false && note.userId !== options.userId) {
        throw new HttpError(403, "Forbidden");
    }

    if (note.files.length === 0) {
        await prisma.note.update({
            where: { id: noteId },
            data: { status: "FAILED" },
        });
        throw new Error("Notatka nie zawiera plików do analizy.");
    }

    await prisma.note.update({
        where: { id: noteId },
        data: { status: "PROCESSING" },
    });

    try {
        const fileParts = await Promise.all(
            note.files.map(async (file, index) => {
                const data = await readStoredFileBytes(file.url);
                return [
                    {
                        type: "text" as const,
                        text: `Plik ${index + 1} z ${note.files.length}: ${file.sourceName || file.name}. Uwzględnij ten plik w transkrypcji i podsumowaniu.`,
                    },
                    {
                        type: "file" as const,
                        data,
                        mediaType: file.type || "application/octet-stream",
                    },
                ];
            }),
        );

        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: noteAnalysisSchema,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                "Przeanalizuj wszystkie załączone pliki notatki, nie pomijaj kolejnych zdjęć ani stron PDF. " +
                                "Odczytaj pismo ręczne oraz tekst drukowany (OCR) i zwróć: " +
                                "(1) pełną transkrypcję całej treści ze wszystkich plików oraz " +
                                "(2) zwięzłe, dobrze uporządkowane podsumowanie najważniejszych pojęć, definicji, wzorów i wniosków. " +
                                "W podsumowaniu łącz informacje ze wszystkich plików. Odpowiadaj wyłącznie po polsku. " +
                                "Jeśli na którymś pliku nie ma czytelnej treści, wspomnij o tym w transkrypcji.",
                        },
                        ...fileParts.flat(),
                    ],
                },
            ],
        });

        await prisma.note.update({
            where: { id: noteId },
            data: {
                content: object.content,
                summary: object.summary,
                status: "COMPLETED",
            },
        });

        revalidatePath("/app");
        revalidatePath("/app/notes");
        revalidatePath(`/notes/${noteId}`);

        return object;
    } catch (error) {
        console.error("Note processing error:", error);
        await prisma.note
            .update({ where: { id: noteId }, data: { status: "FAILED" } })
            .catch(() => undefined);
        throw error;
    }
}
