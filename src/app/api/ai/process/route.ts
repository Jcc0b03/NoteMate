import { google } from "@ai-sdk/google";
import { generateObject, jsonSchema } from "ai";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Allow up to 60s for the AI to read the files and produce a summary.
export const maxDuration = 60;

interface NoteAnalysis {
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
                "Pełna transkrypcja (OCR) całej treści widocznej na załączonych plikach. Po polsku, z zachowaniem struktury.",
        },
    },
    required: ["summary", "content"],
    additionalProperties: false,
});

export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    let noteId: string;
    try {
        const body = await req.json();
        noteId = typeof body?.noteId === "string" ? body.noteId : "";
    } catch {
        return new Response("Invalid body", { status: 400 });
    }

    if (!noteId) {
        return new Response("Missing noteId", { status: 400 });
    }

    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { files: true },
    });

    if (!note) {
        return new Response("Note not found", { status: 404 });
    }

    // Only the owner may (re)process a note.
    if (note.userId !== user.id) {
        return new Response("Forbidden", { status: 403 });
    }

    if (note.files.length === 0) {
        await prisma.note.update({
            where: { id: noteId },
            data: { status: "FAILED" },
        });
        return Response.json(
            { success: false, error: "Notatka nie zawiera plików do analizy." },
            { status: 400 },
        );
    }

    try {
        // Download each file and pass it inline to Gemini (files are <= 10 MB).
        const fileParts = await Promise.all(
            note.files.map(async (file) => {
                const response = await fetch(file.url);
                if (!response.ok) {
                    throw new Error(`Nie udało się pobrać pliku: ${file.name}`);
                }
                const data = new Uint8Array(await response.arrayBuffer());
                return {
                    type: "file" as const,
                    data,
                    mediaType: file.type || "application/octet-stream",
                };
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
                                "Przeanalizuj załączone notatki (zdjęcia lub pliki PDF). Odczytaj pismo ręczne oraz tekst drukowany (OCR) i zwróć: " +
                                "(1) pełną transkrypcję całej treści oraz " +
                                "(2) zwięzłe, dobrze uporządkowane podsumowanie najważniejszych pojęć, definicji, wzorów i wniosków. " +
                                "Odpowiadaj wyłącznie po polsku. Jeśli na plikach nie ma czytelnej treści, napisz to wprost w obu polach.",
                        },
                        ...fileParts,
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

        return Response.json({ success: true });
    } catch (error) {
        console.error("Note processing error:", error);
        await prisma.note
            .update({ where: { id: noteId }, data: { status: "FAILED" } })
            .catch(() => undefined);

        const message = error instanceof Error ? error.message : "Nieznany błąd przetwarzania.";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
