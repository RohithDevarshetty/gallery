import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET /api/public/[slug] - Get public album
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const pin = request.nextUrl.searchParams.get('pin');

    // Get album
    const { data: album, error } = await supabaseAdmin
      .from('albums')
      .select('*, photographers(studio_name, logo_url)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Check if expired
    if (album.expires_at && new Date(album.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Album has expired' }, { status: 410 });
    }

    // Check password protection
    if (album.password) {
      if (!pin) {
        return NextResponse.json(
          { requiresPin: true, album: { id: album.id, title: album.title } },
          { status: 403 }
        );
      }

      const validPin = await bcrypt.compare(pin, album.password);
      if (!validPin) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
      }
    }

    // Increment view count
    await supabaseAdmin
      .from('albums')
      .update({ view_count: album.view_count + 1 })
      .eq('id', album.id);

    // Record analytics
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await supabaseAdmin.from('analytics').insert({
      album_id: album.id,
      event_type: 'view',
      client_ip: clientIp,
      user_agent: userAgent,
    });

    // Get media
    const { data: media } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('album_id', album.id)
      .order('sort_order', { ascending: true });

    // Remove password from response
    const { password, ...albumData } = album;

    return NextResponse.json({
      album: albumData,
      media: media || [],
      photographer: album.photographers,
    });
  } catch (error) {
    console.error('Error fetching public album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
