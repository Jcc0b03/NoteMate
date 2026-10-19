import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http-error";

export const HANDOFF_TTL_MS = 15 * 60_000;

export async function getHandoffSession(id: string | null, ownerId?: string) {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new HttpError(400, "Invalid handoff session");
    }
    const session = await prisma.handoffSession.findUnique({ where: { id } });
    if (!session) throw new HttpError(404, "Handoff session not found");
    if (ownerId && session.userId !== ownerId) throw new HttpError(403, "Forbidden");
    if (session.expiresAt.getTime() <= Date.now()) throw new HttpError(410, "Handoff session expired");
    return session;
}

export function handoffError(error: unknown) {
    return Response.json({ error: error instanceof HttpError ? error.message : "Handoff request failed" },
        { status: error instanceof HttpError ? error.status : 500 });
}
