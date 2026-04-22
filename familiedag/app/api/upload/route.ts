import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<NextResponse>((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'familiedag', resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          resolve(NextResponse.json({ error: 'Upload naar Cloudinary mislukt' }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ url: result.secure_url }));
        }
      }
    );
    stream.end(buffer);
  });
}
