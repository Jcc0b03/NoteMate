import { currentUser } from "@clerk/nextjs/server";
import { uploadPrivateFile } from "@/lib/file-storage";
import { HttpError } from "@/lib/http-error";

export async function POST(request: Request) {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw new HttpError(400, "No file provided");
        const upload = await uploadPrivateFile(file, user.id);
        return Response.json({ url: upload.url, pathname: upload.pathname, size: upload.size, name: upload.name, type: upload.type });
    } catch (error) {
        return Response.json({ error: error instanceof HttpError ? error.message : "Upload failed" },
            { status: error instanceof HttpError ? error.status : 500 });
    }
}
