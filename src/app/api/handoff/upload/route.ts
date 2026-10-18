import { uploadPrivateFile } from "@/lib/file-storage";
import { getHandoffSession, handoffError } from "@/lib/handoff";
import { HttpError } from "@/lib/http-error";

export async function POST(request: Request) {
    try {
        // The unguessable, short-lived QR token permits uploading, never listing files.
        const session = await getHandoffSession(new URL(request.url).searchParams.get("sessionId"));
        if (session.completedAt) throw new HttpError(409, "Handoff session is complete");
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw new HttpError(400, "No file provided");
        const upload = await uploadPrivateFile(file, session.userId, session.id);
        return Response.json({ success: true, name: upload.name, size: upload.size });
    } catch (error) {
        return handoffError(error);
    }
}
