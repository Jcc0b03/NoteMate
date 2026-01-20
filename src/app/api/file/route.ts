import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");
    const user = await currentUser();

    if (!fileId) {
        return new NextResponse("File ID required", { status: 400 });
    }

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const file = await prisma.noteFile.findUnique({
            where: { id: fileId },
            include: {
                note: true,
            },
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

        // Fetch the file from Vercel Blob using the private token
        // Use the token for Read/Write if needed, or if URL is private it requires auth
        const response = await fetch(file.url, {
            headers: {
                // Vercel Blob private access requires the token that created it or has access
                "Authorization": `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
        });

        if (!response.ok) {
            return new NextResponse("Failed to fetch file upstream", { status: response.status });
        }

        const headers = new Headers(response.headers);
        headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        headers.set("Content-Type", file.type);
        // Cache control for performance, but private
        headers.set("Cache-Control", "private, max-age=3600");

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("Error serving file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
