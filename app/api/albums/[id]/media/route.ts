import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/albums/[id]/media - List media in album
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if album exists and is accessible
    const { data: album } = await supabaseAdmin
      .from('albums')
      .select('is_active')
      .eq('id', id)
      .single();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { data: media, error } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('album_id', id)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/albums/[id]/media - Add media to album
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    const { id } = params;
    const body = await request.json();

    // Verify ownership
    const { data: album } = await supabaseAdmin
      .from('albums')
      .select('photographer_id')
      .eq('id', id)
      .single();

    if (!album || album.photographer_id !== userId) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const {
      type,
      filename,
      original_url,
      optimized_url,
      thumbnail_url,
      width,
      height,
      size_bytes,
      duration_seconds,
      mime_type,
      sort_order = 0,
    } = body;

    const mediaData = {
      album_id: id,
      type,
      filename,
      original_url,
      optimized_url,
      thumbnail_url,
      width,
      height,
      size_bytes,
      duration_seconds,
      mime_type,
      sort_order,
    };

    const { data: media, error } = await supabaseAdmin
      .from('media')
      .insert(mediaData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error('Error adding media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
