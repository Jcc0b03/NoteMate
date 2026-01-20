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

    // Upload to Vercel Blob with the specific path structure
    // path: handoff-<sessionId>/filename
    const blob = await put(`handoff-${sessionId}/${file.name}`, file, {
        access: 'public',
    });

    return NextResponse.json(blob);
}
