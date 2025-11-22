import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPresignedDownloadUrl } from '@/lib/r2';

// POST /api/download - Get download URL for media
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, albumSlug } = body;

    if (!mediaId || !albumSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify album allows downloads
    const { data: album } = await supabaseAdmin
      .from('albums')
      .select('id, download_enabled')
      .eq('slug', albumSlug)
      .eq('is_active', true)
      .single();

    if (!album || !album.download_enabled) {
      return NextResponse.json(
        { error: 'Downloads not allowed' },
        { status: 403 }
      );
    }

    // Get media
    const { data: media } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .eq('album_id', album.id)
      .single();

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Increment download count
    await supabaseAdmin
      .from('media')
      .update({ download_count: media.download_count + 1 })
      .eq('id', mediaId);

    // Record analytics
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabaseAdmin.from('analytics').insert({
      album_id: album.id,
      media_id: mediaId,
      event_type: 'download',
      client_ip: clientIp,
      user_agent: userAgent,
    });

    // For R2, extract the path from the original URL
    const urlParts = media.original_url.split('/');
    const path = urlParts.slice(3).join('/'); // Remove protocol and domain

    // Get presigned download URL
    const downloadUrl = await getPresignedDownloadUrl(path);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
