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

    try {
        // Create a marker file to signal completion
        await put(`handoff-${sessionId}/_SESSION_COMPLETE_`, 'done', {
            access: 'public',
            addRandomSuffix: false
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark session complete:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
