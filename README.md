# Gallery - Professional Photo Sharing Platform

A dead-simple gallery platform for photographers to share photos and videos with clients. Built to compete with Pixieset/PicTime at half the price.

![Gallery Platform](https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=Gallery+Platform)

## Features

### For Photographers
- 🚀 **30-Second Setup** - Create and share galleries instantly
- 📸 **Unlimited Photos** - Upload photos and videos with automatic optimization
- 🔒 **PIN Protection** - Secure galleries with optional passwords
- 📊 **Analytics** - Track views and downloads
- 💼 **Professional Branding** - Custom domains and watermarks
- 💰 **Print Sales** - Integrated Stripe payments (coming soon)

### For Clients
- 📱 **Mobile-First Design** - Gorgeous on every device
- ⚡ **Lightning Fast** - Optimized image loading
- 🎯 **Easy Navigation** - Grid view and slideshow mode
- ⬇️ **One-Click Downloads** - Individual or bulk downloads
- ❤️ **Favorites** - Mark and share favorite photos (coming soon)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **Image Processing**: Sharp
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Cloudflare account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gallery.git
cd gallery
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Supabase and Cloudflare R2 (see [START.md](START.md) for detailed instructions)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Documentation

- **[START.md](START.md)** - Complete setup and deployment guide
- **[CLAUDE.md](CLAUDE.md)** - Detailed architecture and business strategy

## Project Structure

```
gallery/
├── app/
│   ├── api/              # API endpoints
│   ├── dashboard/        # Photographer dashboard
│   ├── gallery/          # Public gallery views
│   └── page.tsx          # Landing page
├── lib/
│   ├── supabase.ts      # Database client
│   └── r2.ts            # Storage client
├── components/           # React components
└── supabase-schema.sql  # Database schema
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing

See [START.md](START.md#testing-the-application) for testing instructions.

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/gallery)

Or follow the [deployment guide](START.md#deployment) for detailed instructions.

## Pricing

- **Free Trial**: 14 days, 3 albums, 1GB storage
- **Starter**: $9/month - 10 albums, 10GB storage
- **Pro**: $19/month - Unlimited albums, 100GB storage
- **Studio**: $39/month - 500GB storage, team features

## Roadmap

### MVP (Week 1-2) ✅
- [x] Album creation and management
- [x] Photo/video upload with optimization
- [x] Public gallery view
- [x] PIN protection
- [x] Download functionality
- [x] Mobile-responsive design

### Phase 2 (Weeks 3-4)
- [ ] Client favorites system
- [ ] Email notifications
- [ ] Custom branding
- [ ] Bulk downloads (ZIP)
- [ ] Stripe integration
- [ ] User authentication

### Phase 3 (Months 2-3)
- [ ] Print sales
- [ ] Advanced analytics
- [ ] Custom domains
- [ ] Team collaboration
- [ ] Mobile app

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@gallery.com
- 📖 Docs: [START.md](START.md)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/gallery/issues)

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Cloudflare R2](https://www.cloudflare.com/products/r2/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Sharp](https://sharp.pixelplumbing.com/)

---

**Made with ❤️ for photographers**
