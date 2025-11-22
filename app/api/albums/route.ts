import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// GET /api/albums - List photographer's albums
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from auth header (simplified for MVP)
    const userId = authHeader.replace('Bearer ', '');

    const { data: albums, error } = await supabaseAdmin
      .from('albums')
      .select('*')
      .eq('photographer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/albums - Create new album
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');
    const body = await request.json();

    const {
      title,
      client_name,
      client_email,
      client_phone,
      password,
      download_enabled = true,
      selection_enabled = false,
      max_selections,
      expires_at,
      theme = 'light',
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate unique slug
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4().slice(0, 8)}`;

    const albumData: any = {
      photographer_id: userId,
      title,
      slug,
      client_name,
      client_email,
      client_phone,
      download_enabled,
      selection_enabled,
      max_selections,
      expires_at,
      theme,
      is_active: true,
    };

    // Hash password if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      albumData.password = await bcrypt.hash(password, 10);
    }

    const { data: album, error } = await supabaseAdmin
      .from('albums')
      .insert(albumData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
