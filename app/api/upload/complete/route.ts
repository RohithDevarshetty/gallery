import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import sharp from 'sharp';
import { uploadToR2, generateStoragePath } from '@/lib/r2';

// POST /api/upload/complete - Mark upload complete and process image
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    // Get media record
    const { data: media } = await supabaseAdmin
      .from('media')
      .select('*, albums(photographer_id)')
      .eq('id', mediaId)
      .single();

    if (!media || media.albums.photographer_id !== userId) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // For photos, trigger image optimization
    if (media.type === 'photo') {
      try {
        // Fetch original image
        const response = await fetch(media.original_url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract metadata
        const metadata = await sharp(buffer).metadata();

        // Generate optimized version (1920px wide)
        const optimizedBuffer = await sharp(buffer)
          .resize(1920, null, { withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        const optimizedPath = generateStoragePath(
          userId,
          media.album_id,
          `${mediaId}.webp`,
          'optimized'
        );

        const optimizedUrl = await uploadToR2({
          key: optimizedPath,
          body: optimizedBuffer,
          contentType: 'image/webp',
        });

        // Generate thumbnail (250px wide)
        const thumbnailBuffer = await sharp(buffer)
          .resize(250, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbnailPath = generateStoragePath(
          userId,
          media.album_id,
          `${mediaId}_thumb.webp`,
          'thumbnail'
        );

        const thumbnailUrl = await uploadToR2({
          key: thumbnailPath,
          body: thumbnailBuffer,
          contentType: 'image/webp',
        });

        // Update media record with processed URLs and metadata
        await supabaseAdmin
          .from('media')
          .update({
            optimized_url: optimizedUrl,
            thumbnail_url: thumbnailUrl,
            width: metadata.width,
            height: metadata.height,
          })
          .eq('id', mediaId);
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue even if processing fails - original is already uploaded
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
