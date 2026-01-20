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
        limit: 100, // Ensure we get enough
    });

    if (blobs.length > 0) {
        // Return all found blob object (including url, pathname, etc)
        // User requested "urls", but the frontend needs the full object for metadata. 
        // We will send the full objects but accessible via the 'blobs' key or 'urls' key if strictly needed.
        // To satisfy the specific prompt while maintaining compatibility:
        return NextResponse.json({
            found: true,
            blobs: blobs,
            urls: blobs.map(b => b.url) // Providing the requested array of strings as well
        });
    }

    return NextResponse.json({ found: false, urls: [], blobs: [] });
}
