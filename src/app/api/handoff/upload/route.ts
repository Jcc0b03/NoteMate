import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

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
    const file = form.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
        // path: handoff-<sessionId>/filename
        // Add timestamp to filename to avoid collisions
        const uniqueName = `${Date.now()}-${file.name}`;

        const blob = await put(`handoff-${sessionId}/${uniqueName}`, file, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
