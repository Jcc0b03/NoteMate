import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request): Promise<NextResponse> {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string || file.name;

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
        const blob = await put(filename, file, {
            access: 'private' as any, // Cast to any to bypass type check if types are outdated
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}
