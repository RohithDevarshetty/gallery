-- Photographers (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS photographers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_name TEXT,
  logo_url TEXT,
  custom_domain TEXT UNIQUE,
  stripe_connect_id TEXT,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'studio')),
  trial_ends_at TIMESTAMP DEFAULT NOW() + INTERVAL '14 days',
  storage_used_gb DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Albums/Galleries
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  slug TEXT UNIQUE NOT NULL,
  password TEXT, -- hashed PIN
  cover_photo_id UUID,
  expires_at TIMESTAMP,
  download_enabled BOOLEAN DEFAULT true,
  selection_enabled BOOLEAN DEFAULT false, -- for client favorites
  max_selections INTEGER,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,

  -- Branding
  watermark_url TEXT,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto'))
);

CREATE INDEX IF NOT EXISTS idx_albums_photographer ON albums(photographer_id);
CREATE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);
CREATE INDEX IF NOT EXISTS idx_albums_expires ON albums(expires_at);

-- Photos & Videos
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  filename TEXT NOT NULL,

  -- Storage paths
  original_url TEXT NOT NULL, -- R2 URL
  optimized_url TEXT, -- CDN URL for web viewing
  thumbnail_url TEXT, -- Small preview

  -- Metadata
  width INTEGER,
  height INTEGER,
  size_bytes BIGINT,
  duration_seconds INTEGER, -- for videos
  mime_type TEXT,

  -- Organization
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,

  -- Engagement
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,

  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_album ON media(album_id);
CREATE INDEX IF NOT EXISTS idx_media_sort ON media(album_id, sort_order);

-- Client Selections/Favorites
CREATE TABLE IF NOT EXISTS selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  client_identifier TEXT NOT NULL, -- email or session ID
  selected_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,

  UNIQUE(album_id, media_id, client_identifier)
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'share', 'selection')),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_album_events ON analytics(album_id, event_type, created_at);

-- Download Links (for expiring download URLs)
CREATE TABLE IF NOT EXISTS download_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Photographers
DROP POLICY IF EXISTS "Photographers own albums" ON albums;
CREATE POLICY "Photographers own albums" ON albums
  FOR ALL USING (auth.uid() = photographer_id);

DROP POLICY IF EXISTS "Photographers own media" ON media;
CREATE POLICY "Photographers own media" ON media
  FOR ALL USING (
    album_id IN (SELECT id FROM albums WHERE photographer_id = auth.uid())
  );

-- RLS Policies for Public Access (for clients)
DROP POLICY IF EXISTS "Public can view active albums" ON albums;
CREATE POLICY "Public can view active albums" ON albums
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view media in active albums" ON media;
CREATE POLICY "Public can view media in active albums" ON media
  FOR SELECT USING (
    album_id IN (SELECT id FROM albums WHERE is_active = true)
  );

-- RLS Policies for Selections
DROP POLICY IF EXISTS "Anyone can create selections" ON selections;
CREATE POLICY "Anyone can create selections" ON selections
  FOR INSERT WITH CHECK (
    album_id IN (SELECT id FROM albums WHERE is_active = true AND selection_enabled = true)
  );

DROP POLICY IF EXISTS "Anyone can view their selections" ON selections;
CREATE POLICY "Anyone can view their selections" ON selections
  FOR SELECT USING (true);

-- Function to auto-create photographer record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.photographers (id, created_at)
  VALUES (NEW.id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create photographer record on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
