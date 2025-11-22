## Overview
Dead-simple gallery platform for photographers to share photos and videos with clients. Focused on speed, mobile experience, and professional presentation. Built to compete with Pixieset/PicTime at half the price.

## Core Value Proposition
- **Problem**: Photographers use WeTransfer/Google Drive (unprofessional) or pay $40+/month for complex gallery tools
- **Solution**: Beautiful, fast galleries with client favorites, downloads, and payments in 30 seconds
- **Target**: Wedding, portrait, and event photographers who deliver 20+ galleries/month
- **ROI**: Look professional, sell more prints, save 2 hours per delivery

## Tech Stack
```yaml
Frontend: Next.js 14 with TypeScript
Backend: Next.js API routes  
Database & Auth: Supabase
Storage: Cloudflare R2 ($0.015/GB vs $0.09/GB S3)
Image Processing: Sharp (on-the-fly optimization)
Video: Direct streaming from R2 (no transcoding MVP)
Payments: Stripe Connect (for print sales)
Analytics: Vercel Analytics
Deployment: Vercel
```

## Database Schema (Supabase)
```sql
-- Photographers (extends Supabase auth.users)
CREATE TABLE photographers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  studio_name TEXT,
  logo_url TEXT,
  custom_domain TEXT UNIQUE,
  stripe_connect_id TEXT,
  plan TEXT DEFAULT 'trial', -- trial, starter, pro, studio
  trial_ends_at TIMESTAMP DEFAULT NOW() + INTERVAL '14 days',
  storage_used_gb DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Albums/Galleries
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  slug TEXT UNIQUE, -- for pretty URLs
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
  theme TEXT DEFAULT 'light', -- light, dark, auto
  
  INDEX idx_photographer (photographer_id),
  INDEX idx_slug (slug),
  INDEX idx_expires (expires_at)
);

-- Photos & Videos
CREATE TABLE media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- photo, video
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
  
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_album (album_id),
  INDEX idx_sort (album_id, sort_order)
);

-- Client Selections/Favorites
CREATE TABLE selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  client_identifier TEXT, -- email or session ID
  selected_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(album_id, media_id, client_identifier)
);

-- Analytics Events
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  event_type TEXT, -- view, download, share, selection
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_album_events (album_id, event_type, created_at)
);

-- Download Links (for expiring download URLs)
CREATE TABLE download_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;

-- Photographers can only see their own albums
CREATE POLICY "Photographers own albums" ON albums
  FOR ALL USING (auth.uid() = photographer_id);

CREATE POLICY "Photographers own media" ON media
  FOR ALL USING (
    album_id IN (SELECT id FROM albums WHERE photographer_id = auth.uid())
  );

-- Public can view active albums (for clients)
CREATE POLICY "Public can view active albums" ON albums
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view media in active albums" ON media
  FOR SELECT USING (
    album_id IN (SELECT id FROM albums WHERE is_active = true)
  );
```

## Core Features

### MVP Week 1
1. **Photographer Dashboard**
   - Create album with title
   - Drag & drop upload (photos + videos)
   - Auto-generate shareable link
   - Set optional PIN password
   - View analytics

2. **Client Gallery View**
   - Mobile-optimized grid/slideshow
   - Pinch to zoom on photos
   - Video playback inline
   - Download individual or all as ZIP
   - Share buttons (WhatsApp, Email)

3. **Smart Features**
   - Auto-optimize images for web (Sharp)
   - Lazy loading with blur placeholders
   - Keyboard navigation (arrow keys)
   - Full-screen mode

### Week 2 Additions
1. **Client Favorites System**
   - Heart icon on hover/tap
   - Separate favorites view
   - Email favorites list to photographer
   - Export favorites as collection

2. **Photographer Branding**
   - Upload logo
   - Custom colors
   - Watermark option
   - Custom domain support (CNAME)

3. **Advanced Features**
   - Expiry dates
   - Download limits
   - Album duplication
   - Bulk operations
   - Print store integration

## API Routes
```typescript
// app/api/albums/route.ts
POST   /api/albums              // Create album
GET    /api/albums              // List photographer's albums
GET    /api/albums/[id]         // Get album details
PATCH  /api/albums/[id]         // Update album
DELETE /api/albums/[id]         // Delete album

// app/api/albums/[id]/media/route.ts  
POST   /api/albums/[id]/media   // Upload media
GET    /api/albums/[id]/media   // List media
DELETE /api/albums/[id]/media/[mediaId] // Delete media

// app/api/upload/route.ts
POST   /api/upload/presigned    // Get R2 presigned URL
POST   /api/upload/complete     // Mark upload complete

// app/api/public/[slug]/route.ts
GET    /api/public/[slug]       // Get public album (PIN check)
POST   /api/public/[slug]/auth  // Verify PIN

// app/api/public/[slug]/favorites/route.ts
POST   /api/public/[slug]/favorites      // Add favorite
DELETE /api/public/[slug]/favorites/[id] // Remove favorite
GET    /api/public/[slug]/favorites      // List favorites

// app/api/download/route.ts
POST   /api/download/single     // Download single file
POST   /api/download/bulk       // Generate ZIP download link
```

## Upload Flow
```typescript
// 1. Client-side chunked upload to R2
async function uploadPhotos(files: File[]) {
  for (const file of files) {
    // Get presigned URL from backend
    const { uploadUrl, mediaId } = await fetch('/api/upload/presigned', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        albumId
      })
    });

    // Direct upload to R2
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    // Mark complete & trigger optimization
    await fetch('/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ mediaId })
    });
  }
}

// 2. Backend processes after upload
async function processUpload(mediaId: string) {
  const media = await getMedia(mediaId);
  
  // Generate optimized versions
  const sizes = [
    { width: 250, quality: 80, prefix: 'thumb' },
    { width: 1920, quality: 85, prefix: 'web' }
  ];
  
  for (const size of sizes) {
    await generateOptimizedImage(media.original_url, size);
  }
  
  // Extract metadata
  const metadata = await sharp(media.original_url).metadata();
  await updateMedia(mediaId, { 
    width: metadata.width,
    height: metadata.height 
  });
}
```

## Client Gallery Implementation
```tsx
// app/gallery/[slug]/page.tsx
export default function GalleryPage() {
  const [requiresPin, setRequiresPin] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid');
  
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 z-50 w-full bg-black/80 backdrop-blur">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-white text-xl">{album.title}</h1>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('grid')}>Grid</button>
            <button onClick={() => setViewMode('slideshow')}>Slideshow</button>
            <button onClick={downloadAll}>Download All</button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-1 pt-20">
          {media.map(item => (
            <div key={item.id} className="relative group aspect-square">
              {item.type === 'photo' ? (
                <Image
                  src={item.optimized_url}
                  alt=""
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={item.blur_hash}
                />
              ) : (
                <video
                  src={item.original_url}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              
              {/* Overlay buttons */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button onClick={() => toggleFavorite(item.id)}>♥</button>
                <button onClick={() => download(item.id)}>↓</button>
                <button onClick={() => openLightbox(item.id)}>⛶</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Storage & CDN Strategy
```typescript
// R2 bucket structure
galleries/
  ├── {photographer_id}/
  │   ├── {album_id}/
  │   │   ├── originals/
  │   │   │   ├── IMG_001.jpg
  │   │   │   └── VID_001.mp4
  │   │   ├── optimized/
  │   │   │   ├── web_IMG_001.jpg
  │   │   │   └── thumb_IMG_001.jpg

// Cloudflare Worker for on-the-fly optimization
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cache = caches.default;
    
    // Check cache
    let response = await cache.match(request);
    if (response) return response;
    
    // Parse dimensions from URL
    // /resize/w=1920,q=85/path/to/image.jpg
    const params = parseParams(url.pathname);
    
    // Fetch original from R2
    const original = await env.BUCKET.get(params.path);
    
    // Resize with Cloudflare Image Resizing
    response = await fetch(`https://example.com${params.path}`, {
      cf: {
        image: {
          width: params.width,
          quality: params.quality
        }
      }
    });
    
    // Cache for 1 year
    response = new Response(response.body, response);
    response.headers.set('Cache-Control', 'public, max-age=31536000');
    await cache.put(request, response.clone());
    
    return response;
  }
}
```

## Pricing Strategy
```yaml
Free Trial: 14 days
- 3 active albums
- 1GB storage
- Basic features

Starter: $9/month
- 10 active albums  
- 10GB storage
- Client favorites
- Basic analytics
- Remove watermark

Pro: $19/month (Most Popular)
- Unlimited albums
- 100GB storage
- Custom branding
- Download analytics
- Priority support
- Custom domain

Studio: $39/month
- Everything in Pro
- 500GB storage
- Multiple photographers
- Advanced analytics
- API access
- White label option
```

## Go-to-Market Strategy

### Week 1: Pre-Launch
1. **Landing Page**
   - Headline: "Share Photos with Clients in 30 Seconds"
   - Comparison chart vs Pixieset/CloudSpot
   - Early bird: 50% off for life

2. **Content Creation**
   - Blog: "Why I left Pixieset for [YourApp]"
   - YouTube: Speed comparison video
   - Instagram Reels: Before/after workflow

3. **Community Outreach**
   - r/WeddingPhotography
   - Facebook: "Wedding Photographers International"
   - Photography forums

### Week 2: Launch
1. **ProductHunt** - Tuesday launch
2. **Lifetime Deal** - $99 for first 100 users
3. **Influencer Outreach** - 50 photography YouTubers
4. **Facebook Ads** - Target Pixieset users
5. **Google Ads** - "pixieset alternative"

### Month 2-3: Scale
1. **Partnerships**
   - Photography education platforms
   - Camera stores
   - Wedding directories

2. **SEO Content**
   - "[Competitor] Alternative" pages
   - Photography workflow guides
   - Gallery delivery best practices

3. **Referral Program**
   - 30% recurring commission
   - Special link for each photographer
   - Promotional materials provided

## Success Metrics

### Week 1 Goals
- 100 signups
- 20 albums created
- 5 paying customers
- 3 testimonials

### Month 1 Goals
- 500 signups
- 100 active albums
- 25 paying customers ($375 MRR)
- 10 5-star reviews

### Month 3 Goals
- 2000 signups
- 500 active albums
- 100 paying customers ($1,900 MRR)
- 50 reviews
- 3 partnership deals

### Month 6 Goals
- 5000 signups
- 2000 active albums
- 400 paying customers ($7,600 MRR)
- Break-even on costs

## Competitive Advantages

1. **Price** - 50-75% cheaper than competitors
2. **Speed** - 30-second album creation
3. **Simplicity** - No learning curve
4. **Mobile-first** - Built for phone viewing
5. **Performance** - Instant loading with R2 + CDN

## Technical Optimizations

### Image Optimization Pipeline
```typescript
// Generate multiple sizes on upload
const imagePipeline = [
  { width: 2048, quality: 85, format: 'webp' }, // Full size
  { width: 1024, quality: 80, format: 'webp' }, // Medium
  { width: 256, quality: 75, format: 'webp' },  // Thumbnail
  { width: 32, quality: 50, format: 'webp' }    // Blur placeholder
];

// Lazy loading with blur-up effect
<Image
  src={photo.optimized_url}
  placeholder="blur"
  blurDataURL={photo.blur_url}
  loading="lazy"
/>
```

### Performance Targets
- First Contentful Paint: <1s
- Gallery Load: <2s for 100 photos
- Video Start: <1s
- Download ZIP Generation: <10s for 1GB

## Cost Analysis

### Monthly Costs at Scale
```yaml
100 photographers (1TB storage):
- Vercel: $20
- Supabase: $25
- R2 Storage: $15 (1TB)
- R2 Bandwidth: $36 (2TB egress)
- Stripe fees: ~$30
Total: $126

Revenue: 100 × $19 = $1,900
Profit: $1,774 (93% margin)

1000 photographers (10TB storage):
- Vercel Pro: $20
- Supabase Pro: $25  
- R2 Storage: $150
- R2 Bandwidth: $360
- Support tool: $50
Total: $605

Revenue: 1000 × $19 = $19,000
Profit: $18,395 (97% margin)
```

## Future Enhancements

### Phase 2 (Months 4-6)
- Print sales integration (30% commission)
- AI face detection for auto-tagging
- Client comments on photos
- Slideshow with music
- Mobile app for photographers

### Phase 3 (Months 7-12)
- Video editing tools
- RAW file support
- Lightroom plugin
- Team collaboration
- White-label solution

## Risk Mitigation

1. **Storage Costs** - Use progressive pricing tiers
2. **Video Bandwidth** - Implement view limits on free tier
3. **Competition** - Focus on specific niche (weddings first)
4. **Churn** - Annual plans with 20% discount
5. **Support** - Extensive self-service documentation

## Launch Checklist

### Technical
- [ ] Upload flow working
- [ ] Gallery responsive on mobile
- [ ] PIN protection tested
- [ ] Download ZIP working
- [ ] Payment integration live

### Marketing
- [ ] Landing page live
- [ ] 10 beta testers confirmed
- [ ] ProductHunt assets ready
- [ ] Facebook ads created
- [ ] Documentation complete

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy  
- [ ] DMCA process
- [ ] Data retention policy

## Summary

This platform can realistically achieve:
- **Week 1**: First paying customer
- **Month 1**: $375 MRR
- **Month 3**: $1,900 MRR  
- **Month 6**: $7,600 MRR
- **Year 1**: $30,000 MRR

The key differentiators are extreme simplicity, mobile-first design, and aggressive pricing targeting photographers who want a simple, affordable solution.
