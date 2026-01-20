import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json(
            { error: 'Missing sessionId parameter' },
            { status: 400 }
        );
    }

    // List functionality requires BLOB_READ_WRITE_TOKEN
    const { blobs } = await list({
        prefix: `handoff-${sessionId}/`,
    });

    if (blobs.length > 0) {
        // Return all found blob URLs
        return NextResponse.json({
            found: true,
            blobs: blobs,
        });
    }

    return NextResponse.json({ found: false, urls: [] });
}
