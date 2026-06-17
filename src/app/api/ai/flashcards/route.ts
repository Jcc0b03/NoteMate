import { google } from "@ai-sdk/google";
import { generateObject, jsonSchema } from "ai";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../../../../generated/prisma/client";

export const maxDuration = 60;

interface Flashcard {
    front: string;
    back: string;
}

interface FlashcardResponse {
    cards: Flashcard[];
}

const flashcardsSchema = jsonSchema<FlashcardResponse>({
    type: "object",
    properties: {
        cards: {
            type: "array",
            minItems: 6,
            maxItems: 20,
            items: {
                type: "object",
                properties: {
                    front: {
                        type: "string",
                        description: "Krótka strona pytania albo hasła do zapamiętania.",
                    },
                    back: {
                        type: "string",
                        description: "Zwięzła odpowiedź, definicja, wyjaśnienie albo wzór.",
                    },
                },
                required: ["front", "back"],
                additionalProperties: false,
            },
        },
    },
    required: ["cards"],
    additionalProperties: false,
});

export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    let noteId = "";
    let regenerate = false;
    try {
        const body = await req.json();
        noteId = typeof body?.noteId === "string" ? body.noteId : "";
        regenerate = Boolean(body?.regenerate);
    } catch {
        return new Response("Invalid body", { status: 400 });
    }

    if (!noteId) {
        return new Response("Missing noteId", { status: 400 });
    }

    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: {
            subject: true,
            flashcardDecks: {
                where: { userId: user.id },
                take: 1,
            },
        },
    });

    if (!note) {
        return new Response("Note not found", { status: 404 });
    }

    const hasAccess = note.userId === user.id || note.isShared || note.sharedWith.includes(user.id);
    if (!hasAccess) {
        return new Response("Forbidden", { status: 403 });
    }

    const existingDeck = note.flashcardDecks[0];
    if (existingDeck && !regenerate) {
        return Response.json({
            success: true,
            deck: {
                id: existingDeck.id,
                token: existingDeck.token,
                title: existingDeck.title,
                cards: existingDeck.cards,
            },
        });
    }

    if (note.status !== "COMPLETED" || (!note.summary && !note.content)) {
        return Response.json(
            { success: false, error: "Najpierw poczekaj na zakończenie przetwarzania notatki przez AI." },
            { status: 409 },
        );
    }

    try {
        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: flashcardsSchema,
            messages: [
                {
                    role: "user",
                    content:
                        "Na podstawie poniższej notatki wygeneruj fiszki do nauki. " +
                        "Fiszki mają być po polsku, konkretne, bez lania wody. " +
                        "Ujmij definicje, zależności, daty, wzory i najważniejsze wnioski. " +
                        "Przód fiszki ma być pytaniem lub hasłem, tył krótką odpowiedzią.\n\n" +
                        `Tytuł: ${note.title || "Notatka"}\n` +
                        `Przedmiot: ${note.subject?.name || "Brak"}\n\n` +
                        `Podsumowanie:\n${note.summary || "Brak"}\n\n` +
                        `Transkrypcja:\n${note.content || "Brak"}`,
                },
            ],
        });

        const cardsJson = object.cards as unknown as Prisma.InputJsonValue;
        const deck = await prisma.flashcardDeck.upsert({
            where: {
                noteId_userId: {
                    noteId,
                    userId: user.id,
                },
            },
            update: {
                title: note.title || "Fiszki z notatki",
                cards: cardsJson,
            },
            create: {
                noteId,
                userId: user.id,
                title: note.title || "Fiszki z notatki",
                cards: cardsJson,
            },
        });

        return Response.json({
            success: true,
            deck: {
                id: deck.id,
                token: deck.token,
                title: deck.title,
                cards: deck.cards,
            },
        });
    } catch (error) {
        console.error("Flashcard generation error:", error);
        const message = error instanceof Error ? error.message : "Nie udało się wygenerować fiszek.";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
