import { currentUser } from "@clerk/nextjs/server";
import { deleteUnclaimedUpload } from "@/lib/file-storage";
import { HttpError } from "@/lib/http-error";

export async function DELETE(request: Request) {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const body = await request.json();
        if (typeof body?.url !== "string") throw new HttpError(400, "URL is required");
        await deleteUnclaimedUpload(body.url, user.id);
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error instanceof HttpError ? error.message : "Delete failed" },
            { status: error instanceof HttpError ? error.status : 500 });
    }
}
