import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Database types
export interface Photographer {
  id: string;
  studio_name: string | null;
  logo_url: string | null;
  custom_domain: string | null;
  stripe_connect_id: string | null;
  plan: 'trial' | 'starter' | 'pro' | 'studio';
  trial_ends_at: string;
  storage_used_gb: number;
  created_at: string;
}

export interface Album {
  id: string;
  photographer_id: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  slug: string;
  password: string | null;
  cover_photo_id: string | null;
  expires_at: string | null;
  download_enabled: boolean;
  selection_enabled: boolean;
  max_selections: number | null;
  is_active: boolean;
  view_count: number;
  created_at: string;
  delivered_at: string | null;
  watermark_url: string | null;
  theme: 'light' | 'dark' | 'auto';
}

export interface Media {
  id: string;
  album_id: string;
  type: 'photo' | 'video';
  filename: string;
  original_url: string;
  optimized_url: string | null;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number;
  duration_seconds: number | null;
  mime_type: string;
  sort_order: number;
  is_cover: boolean;
  view_count: number;
  download_count: number;
  uploaded_at: string;
}

export interface Selection {
  id: string;
  album_id: string;
  media_id: string;
  client_identifier: string;
  selected_at: string;
  notes: string | null;
}
