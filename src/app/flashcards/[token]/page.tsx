import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FlashcardStudyView } from "@/components/FlashcardStudyView";

interface PageProps {
    params: Promise<{ token: string }>;
}

interface Flashcard {
    front: string;
    back: string;
}

function parseCards(value: unknown): Flashcard[] {
    if (!Array.isArray(value)) return [];

    return value.filter((card): card is Flashcard => (
        typeof card === "object" &&
        card !== null &&
        "front" in card &&
        "back" in card &&
        typeof card.front === "string" &&
        typeof card.back === "string"
    ));
}

export default async function FlashcardsPage({ params }: PageProps) {
    const { token } = await params;

    const deck = await prisma.flashcardDeck.findUnique({
        where: { token },
        include: { note: true },
    });

    if (!deck) {
        notFound();
    }

    const cards = parseCards(deck.cards);
    if (cards.length === 0) {
        notFound();
    }

    return (
        <FlashcardStudyView
            title={deck.title || "Fiszki"}
            noteTitle={deck.note.title || "Notatka"}
            cards={cards}
        />
    );
}
