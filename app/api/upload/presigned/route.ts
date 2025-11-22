import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPresignedUploadUrl, generateStoragePath } from '@/lib/r2';
import { v4 as uuidv4 } from 'uuid';

// POST /api/upload/presigned - Get presigned URL for direct upload to R2
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    const body = await request.json();

    const { filename, contentType, size, albumId } = body;

    if (!filename || !contentType || !albumId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify album ownership
    const { data: album } = await supabaseAdmin
      .from('albums')
      .select('photographer_id')
      .eq('id', albumId)
      .single();

    if (!album || album.photographer_id !== userId) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Generate unique media ID and storage path
    const mediaId = uuidv4();
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = `${mediaId}.${fileExtension}`;
    const storagePath = generateStoragePath(
      userId,
      albumId,
      uniqueFilename,
      'original'
    );

    // Get presigned URL for upload
    const uploadUrl = await getPresignedUploadUrl(storagePath, contentType);

    // Determine media type
    const type = contentType.startsWith('video/') ? 'video' : 'photo';

    // Create media record
    const { data: media, error } = await supabaseAdmin
      .from('media')
      .insert({
        id: mediaId,
        album_id: albumId,
        type,
        filename,
        original_url: `${process.env.R2_PUBLIC_URL}/${storagePath}`,
        size_bytes: size,
        mime_type: contentType,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      uploadUrl,
      mediaId,
      storagePath,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
