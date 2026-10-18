import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { readStoredFile } from "@/lib/file-storage";
import { ALLOWED_UPLOAD_CONTENT_TYPES } from "@/lib/upload-validation";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");
    const noteId = searchParams.get("noteId");
    const user = await currentUser();

    if (!fileId && !noteId) {
        return new NextResponse("File ID required", { status: 400 });
    }

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const file = fileId ? await prisma.noteFile.findUnique({
            where: { id: fileId },
            include: {
                note: true,
            },
        }) : await prisma.noteFile.findFirst({
            where: { noteId: noteId!, type: { startsWith: "image/" } },
            orderBy: { createdAt: "asc" },
            include: { note: true },
        });

        if (!file) {
            return new NextResponse("File not found", { status: 404 });
        }

        const note = file.note;
        const isOwner = note.userId === user.id;
        const isShared = note.isShared || note.sharedWith.includes(user.id);

        if (!isOwner && !isShared) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const response = await readStoredFile(file.url);

        if (!response.ok) {
            return new NextResponse("Failed to fetch file upstream", { status: response.status });
        }

        const safeType = ALLOWED_UPLOAD_CONTENT_TYPES.find(type => type === file.type);
        const headers = new Headers();
        headers.set("Content-Disposition", `${safeType ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        headers.set("Content-Type", safeType || "application/octet-stream");
        headers.set("Cache-Control", "private, no-store");
        headers.set("Vary", "Cookie");
        headers.set("X-Content-Type-Options", "nosniff");

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("Error serving file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
