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

function serializeDeck(deck: {
    id: string;
    token: string;
    title: string | null;
    cards: Prisma.JsonValue;
    createdAt: Date;
}) {
    return {
        id: deck.id,
        token: deck.token,
        title: deck.title,
        cards: deck.cards,
        createdAt: deck.createdAt.toISOString(),
    };
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

export async function GET(req: Request) {
    const user = await currentUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId") || "";

    if (!noteId) {
        return new Response("Missing noteId", { status: 400 });
    }

    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: {
            flashcardDecks: {
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
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

    return Response.json({
        success: true,
        decks: note.flashcardDecks.map(serializeDeck),
    });
}

export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    let noteId = "";
    let deckTitle = "";
    try {
        const body = await req.json();
        noteId = typeof body?.noteId === "string" ? body.noteId : "";
        deckTitle = typeof body?.deckTitle === "string" ? body.deckTitle.trim() : "";
    } catch {
        return new Response("Invalid body", { status: 400 });
    }

    if (!noteId) {
        return new Response("Missing noteId", { status: 400 });
    }

    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: { subject: true },
    });

    if (!note) {
        return new Response("Note not found", { status: 404 });
    }

    const hasAccess = note.userId === user.id || note.isShared || note.sharedWith.includes(user.id);
    if (!hasAccess) {
        return new Response("Forbidden", { status: 403 });
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
        const existingDecksCount = await prisma.flashcardDeck.count({
            where: { noteId, userId: user.id },
        });
        const deck = await prisma.flashcardDeck.create({
            data: {
                noteId,
                userId: user.id,
                title: deckTitle || `${note.title || "Fiszki"} - zestaw ${existingDecksCount + 1}`,
                cards: cardsJson,
            },
        });

        return Response.json({
            success: true,
            deck: serializeDeck(deck),
        });
    } catch (error) {
        console.error("Flashcard generation error:", error);
        const message = error instanceof Error ? error.message : "Nie udało się wygenerować fiszek.";
        return Response.json({ success: false, error: message }, { status: 500 });
    }
}
