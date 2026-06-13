import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUploadValidationError, sanitizeUploadFilename } from '@/lib/upload-validation';

export async function POST(request: Request): Promise<NextResponse> {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!(fileEntry instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = getUploadValidationError(fileEntry);

    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const requestedFilename = formData.get('filename');
    const filename = sanitizeUploadFilename(typeof requestedFilename === 'string' ? requestedFilename : fileEntry.name);

    // Generate random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    const finalFilename = `${name}_${randomSuffix}${ext}`;

    try {
        const blob = await put(finalFilename, fileEntry, {
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
