import { prisma } from "@/lib/prisma";
import { getHandoffSession, handoffError } from "@/lib/handoff";

export async function POST(request: Request) {
    try {
        const session = await getHandoffSession(new URL(request.url).searchParams.get("sessionId"));
        await prisma.handoffSession.updateMany({ where: { id: session.id, completedAt: null }, data: { completedAt: new Date() } });
        return Response.json({ success: true });
    } catch (error) {
        return handoffError(error);
    }
}
