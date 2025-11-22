'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface Media {
  id: string;
  type: 'photo' | 'video';
  filename: string;
  thumbnail_url: string | null;
  optimized_url: string | null;
  original_url: string;
  width: number | null;
  height: number | null;
}

interface Album {
  id: string;
  title: string;
  theme: 'light' | 'dark' | 'auto';
  download_enabled: boolean;
}

interface Photographer {
  studio_name: string | null;
  logo_url: string | null;
}

export default function GalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pin, setPin] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, [slug]);

  async function fetchGallery(pinCode?: string) {
    try {
      const url = pinCode
        ? `/api/public/${slug}?pin=${pinCode}`
        : `/api/public/${slug}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.status === 403 && data.requiresPin) {
        setRequiresPin(true);
        return;
      }

      if (response.ok) {
        setAlbum(data.album);
        setPhotographer(data.photographer);
        setMedia(data.media || []);
        setRequiresPin(false);
      } else {
        alert(data.error || 'Failed to load gallery');
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchGallery(pin);
  }

  async function handleDownload(mediaId: string) {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId, albumSlug: slug }),
      });

      if (response.ok) {
        const { downloadUrl } = await response.json();
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading:', error);
    }
  }

  function openLightbox(index: number) {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function nextImage() {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }

  function prevImage() {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, media.length]);

  if (requiresPin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Protected Gallery</h2>
          <p className="text-gray-600 mb-6">
            This gallery is password protected. Please enter the PIN to continue.
          </p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              maxLength={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Access Gallery
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">Loading gallery...</p>
      </div>
    );
  }

  const isDark = album.theme === 'dark' || (album.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 backdrop-blur ${isDark ? 'bg-black/80' : 'bg-white/80'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {album.title}
              </h1>
              {photographer?.studio_name && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  by {photographer.studio_name}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => {
                  setViewMode('slideshow');
                  setCurrentIndex(0);
                  setLightboxOpen(true);
                }}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'slideshow'
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Slideshow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {media.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              This gallery is empty
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {media.map((item, index) => (
              <div
                key={item.id}
                className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                {item.type === 'photo' ? (
                  <Image
                    src={item.thumbnail_url || item.optimized_url || item.original_url}
                    alt={item.filename}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <video
                    src={item.original_url}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  {album.download_enabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item.id);
                      }}
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200"
                    >
                      Download
                    </button>
                  )}
                  <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxOpen && media.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50"
          >
            ×
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 text-white text-4xl hover:text-gray-300 z-50"
          >
            ‹
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 text-white text-4xl hover:text-gray-300 z-50"
          >
            ›
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {media[currentIndex].type === 'photo' ? (
              <Image
                src={media[currentIndex].optimized_url || media[currentIndex].original_url}
                alt={media[currentIndex].filename}
                fill
                className="object-contain"
              />
            ) : (
              <video
                src={media[currentIndex].original_url}
                controls
                className="max-w-full max-h-full"
              />
            )}
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center text-white">
            <p className="text-lg">
              {currentIndex + 1} / {media.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
