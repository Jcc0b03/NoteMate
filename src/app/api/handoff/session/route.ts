import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { HANDOFF_TTL_MS } from "@/lib/handoff";

export async function POST() {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const session = await prisma.handoffSession.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + HANDOFF_TTL_MS) } });
    return Response.json({ sessionId: session.id, expiresAt: session.expiresAt }, { headers: { "Cache-Control": "no-store" } });
}
