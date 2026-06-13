import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getUploadValidationError, sanitizeUploadFilename } from '@/lib/upload-validation';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing sessionId parameter' },
            { status: 400 }
        );
    }

    const form = await request.formData();
    const fileEntry = form.get('file');

    if (!(fileEntry instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = getUploadValidationError(fileEntry);

    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    try {
        // path: handoff-<sessionId>/filename
        // Add timestamp to filename to avoid collisions
        const uniqueName = `${Date.now()}-${sanitizeUploadFilename(fileEntry.name)}`;

        const blob = await put(`handoff-${sessionId}/${uniqueName}`, fileEntry, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
