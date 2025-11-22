# Gallery Platform - Setup & Deployment Guide

## Project Overview

This is a professional photography gallery platform built to compete with Pixieset/PicTime at half the price. The platform allows photographers to create beautiful, fast galleries, share them with clients, and manage photo delivery efficiently.

**Built with:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Database & Auth)
- Cloudflare R2 (Storage)
- Sharp (Image Processing)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Supabase Setup](#supabase-setup)
4. [Cloudflare R2 Setup](#cloudflare-r2-setup)
5. [Running the Application](#running-the-application)
6. [Testing the Application](#testing-the-application)
7. [Deployment](#deployment)
8. [Production Checklist](#production-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- A **Supabase account** ([Sign up here](https://supabase.com))
- A **Cloudflare account** ([Sign up here](https://cloudflare.com))
- **Git** installed

---

## Local Development Setup

### 1. Clone the Repository

```bash
cd /home/user/gallery
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

You'll need to fill in the following values (instructions below):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=gallery-uploads
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

---

## Supabase Setup

### 1. Create a New Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: gallery-platform
   - **Database Password**: (Save this somewhere safe!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Get Your API Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Database Schema

1. Open the **SQL Editor** in Supabase dashboard
2. Open the file `supabase-schema.sql` from this project
3. Copy the entire contents
4. Paste into SQL Editor and click **Run**

This will create all necessary tables:
- `photographers` - Photographer accounts
- `albums` - Photo galleries
- `media` - Photos and videos
- `selections` - Client favorites
- `analytics` - Usage tracking
- `download_links` - Temporary download URLs

### 4. Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see all the tables listed above
3. Click on each table to verify the structure

---

## Cloudflare R2 Setup

### 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2** in the sidebar
3. Click **Create bucket**
4. Name it: `gallery-uploads` (or your preferred name)
5. Click **Create bucket**

### 2. Get R2 Credentials

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Fill in:
   - **Token name**: gallery-platform
   - **Permissions**: Admin Read & Write
   - **Bucket scope**: Apply to specific buckets → Select your bucket
4. Click **Create API Token**
5. **IMPORTANT**: Save these values immediately (you can't view them again):
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`

### 3. Get Account ID

1. Go to **R2** overview
2. Copy your **Account ID** from the right sidebar
3. Add to `.env.local` → `R2_ACCOUNT_ID`

### 4. Configure Public Access (Optional)

For public image viewing without pre-signed URLs:

1. Go to your bucket → **Settings**
2. Under **Public Access**, click **Allow Access**
3. Copy the **Public bucket URL**
4. Add to `.env.local` → `R2_PUBLIC_URL`

**OR** keep it private and use pre-signed URLs (more secure, current implementation)

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Testing the Application

### 1. Test Homepage

1. Visit `http://localhost:3000`
2. You should see the landing page

### 2. Test Dashboard (Create Album)

1. Visit `http://localhost:3000/dashboard`
2. Click **"+ New Album"**
3. Fill in:
   - **Album Title**: Test Wedding Gallery
   - **Client Name**: John & Sarah
   - **Client Email**: test@example.com
   - **PIN**: 1234 (optional)
4. Click **Create Album**
5. You should see the album appear in the dashboard

### 3. Test File Upload

1. Click on the album you just created
2. Click **"Click to upload"** in the upload area
3. Select some test images (JPEG/PNG)
4. Wait for upload to complete
5. You should see thumbnails appear in the gallery grid

**Note**: For upload to work, you MUST have Cloudflare R2 configured. Without it, uploads will fail.

### 4. Test Gallery View (Client Side)

1. Copy the gallery URL from the album detail page
2. Open it in a new incognito window (to simulate client view)
3. If you set a PIN, enter it
4. You should see the gallery with all uploaded photos
5. Test features:
   - Click on an image to open lightbox
   - Use arrow keys to navigate
   - Click "Download" button (if enabled)
   - Switch between Grid/Slideshow views

### 5. Test PIN Protection

1. Create a new album with a PIN (e.g., "1234")
2. Upload some photos
3. Visit the public gallery URL
4. You should be prompted for PIN
5. Enter the correct PIN → should grant access
6. Enter wrong PIN → should show error

---

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to **Settings** → **Environment Variables**
   - Add all variables from `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `R2_ACCOUNT_ID`
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`
     - `R2_BUCKET_NAME`
     - `R2_PUBLIC_URL`
     - `NEXTAUTH_SECRET` (generate a new one: `openssl rand -base64 32`)

4. **Deploy**:
   - Click **Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Visit your production URL

### Deploy to Other Platforms

The application can also be deployed to:
- **AWS Amplify**
- **Netlify**
- **DigitalOcean App Platform**
- **Railway**

Follow their respective Next.js deployment guides.

---

## Production Checklist

Before going live, ensure:

### Security
- [ ] Changed `NEXTAUTH_SECRET` to a strong random value
- [ ] **DO NOT** commit `.env.local` to git
- [ ] Enabled Supabase Row Level Security (RLS) policies
- [ ] Restricted Supabase service role key to server-side only
- [ ] Set up CORS properly on R2 bucket
- [ ] Enabled HTTPS (automatic on Vercel)

### Authentication
- [ ] Implement proper authentication (current MVP uses placeholder)
- [ ] Add user registration/login flow
- [ ] Integrate with Supabase Auth
- [ ] Add email verification
- [ ] Set up password reset flow

### Features
- [ ] Test upload with large files (50MB+)
- [ ] Test with 100+ photos in a gallery
- [ ] Verify image optimization is working
- [ ] Test on mobile devices
- [ ] Test PIN protection
- [ ] Test download functionality

### Performance
- [ ] Enable Vercel Analytics
- [ ] Set up CDN caching
- [ ] Optimize images with next/image
- [ ] Enable gzip compression
- [ ] Monitor Supabase performance

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor R2 storage usage
- [ ] Monitor Supabase database size
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

---

## Troubleshooting

### Build Fails

**Error: `Module not found`**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error: `Tailwind CSS not working`**
```bash
# Ensure Tailwind v3 is installed
npm install tailwindcss@^3.4.0
```

### Upload Not Working

**Error: `Failed to get upload URL`**
- Check R2 credentials in `.env.local`
- Verify R2 bucket exists
- Check R2 API token permissions

**Error: `403 Forbidden on upload`**
- Verify R2 API token has write permissions
- Check CORS settings on R2 bucket

### Database Connection Issues

**Error: `Invalid Supabase credentials`**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure project is not paused (free tier)

**Error: `Row Level Security violation`**
- Check RLS policies in Supabase
- Verify user is authenticated
- Check policy conditions

### Images Not Displaying

**Error: `Image optimization failed`**
- Verify Sharp is installed: `npm install sharp`
- Check R2_PUBLIC_URL is set correctly
- Verify image URLs are accessible

**Error: `Images show broken`**
- Check R2 bucket public access settings
- Verify CORS is configured
- Check browser console for errors

### Local Development

**Error: `Port 3000 already in use`**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

---

## Next Steps

### Immediate Tasks

1. **Implement Proper Authentication**
   - Replace placeholder auth with Supabase Auth
   - Add registration/login pages
   - Secure API routes with middleware

2. **Add Stripe Integration**
   - Set up Stripe Connect for photographers
   - Implement subscription billing
   - Add print sales feature

3. **Enhance Features**
   - Client favorites system
   - Bulk download as ZIP
   - Email notifications
   - Custom branding per photographer

4. **Testing**
   - Write unit tests
   - Add E2E tests with Playwright
   - Load testing for file uploads
   - Mobile testing

### Marketing Launch

Refer to the **Go-to-Market Strategy** section in `CLAUDE.md` for:
- Landing page copy
- Pricing strategy
- Launch timeline
- Content marketing plan

---

## Support

For issues or questions:

1. Check this documentation
2. Review the `CLAUDE.md` file for architecture details
3. Check the code comments
4. Open an issue on GitHub

---

## Architecture Overview

```
gallery/
├── app/                      # Next.js 14 App Router
│   ├── api/                 # API Routes
│   │   ├── albums/          # Album CRUD
│   │   ├── upload/          # File upload handling
│   │   ├── public/          # Public gallery access
│   │   └── download/        # Download endpoints
│   ├── dashboard/           # Photographer dashboard
│   │   └── albums/[id]/    # Album detail & upload
│   ├── gallery/[slug]/     # Public gallery view
│   └── page.tsx            # Landing page
├── lib/                     # Utility functions
│   ├── supabase.ts         # Supabase client
│   └── r2.ts               # R2 storage helpers
├── components/              # React components
├── supabase-schema.sql     # Database schema
└── .env.local              # Environment variables
```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint

# Database
# Run SQL in Supabase dashboard SQL Editor

# Deployment
vercel                  # Deploy to Vercel
vercel --prod          # Deploy to production
```

### Important URLs

- **Local Dev**: http://localhost:3000
- **Supabase Dashboard**: https://app.supabase.com
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## License

See the `LICENSE` file for details.

---

**Built with ❤️ for photographers**

Need help? Check CLAUDE.md for detailed architecture and business strategy.
