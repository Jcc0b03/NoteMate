import { currentUser } from "@clerk/nextjs/server";
import { processNoteWithAi } from "@/lib/note-ai";
import { HttpError } from "@/lib/http-error";

// Allow up to 60s for the AI to read the files and produce a summary.
export const maxDuration = 60;

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

    try {
        await processNoteWithAi(noteId, { userId: user.id });
        return Response.json({ success: true });
    } catch (error) {
        // Only processNoteWithAi may update status, after checking ownership.
        const message = error instanceof HttpError ? error.message : "Nie udało się przetworzyć notatki.";
        const status = error instanceof HttpError ? error.status : 500;
        return Response.json({ success: false, error: message }, { status });
    }
}
