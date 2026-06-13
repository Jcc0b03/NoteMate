import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ALLOWED_UPLOAD_CONTENT_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/upload-validation';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (/* pathname: string, clientPayload */) => {
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_CONTENT_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { url } = await request.json();
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
