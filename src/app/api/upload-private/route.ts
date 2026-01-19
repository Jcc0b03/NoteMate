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


    // Generate random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const finalFilename = `${name}_${randomSuffix}${ext}`;

    try {
        const blob = await put(finalFilename, file, {
            access: 'public',
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
