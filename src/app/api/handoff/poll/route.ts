import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getHandoffSession, handoffError } from "@/lib/handoff";

export async function GET(request: Request) {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const session = await getHandoffSession(new URL(request.url).searchParams.get("sessionId"), user.id);
        const blobs = await prisma.upload.findMany({
            where: { handoffId: session.id, userId: user.id },
            select: { url: true, pathname: true, size: true, name: true, type: true },
            orderBy: { createdAt: "asc" },
        });
        return Response.json({ found: blobs.length > 0, completed: !!session.completedAt, blobs },
            { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        return handoffError(error);
    }
}
