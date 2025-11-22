import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/albums/[id] - Get album details
export async function GET(
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

    const { data: album, error } = await supabaseAdmin
      .from('albums')
      .select('*')
      .eq('id', id)
      .eq('photographer_id', userId)
      .single();

    if (error || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Get media count
    const { count: mediaCount } = await supabaseAdmin
      .from('media')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', id);

    return NextResponse.json({ album: { ...album, media_count: mediaCount } });
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/albums/[id] - Update album
export async function PATCH(
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
    const updates = await request.json();

    // Verify ownership
    const { data: existingAlbum } = await supabaseAdmin
      .from('albums')
      .select('photographer_id')
      .eq('id', id)
      .single();

    if (!existingAlbum || existingAlbum.photographer_id !== userId) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Hash password if being updated
    if (updates.password) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const { data: album, error } = await supabaseAdmin
      .from('albums')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ album });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/albums/[id] - Delete album
export async function DELETE(
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

    // Verify ownership
    const { data: existingAlbum } = await supabaseAdmin
      .from('albums')
      .select('photographer_id')
      .eq('id', id)
      .single();

    if (!existingAlbum || existingAlbum.photographer_id !== userId) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('albums')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
