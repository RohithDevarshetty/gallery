'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Media {
  id: string;
  type: 'photo' | 'video';
  filename: string;
  thumbnail_url: string | null;
  optimized_url: string | null;
  original_url: string;
}

interface Album {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchAlbum();
    fetchMedia();
  }, [albumId]);

  async function fetchAlbum() {
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        headers: {
          'Authorization': 'Bearer demo-user-id',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlbum(data.album);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
    }
  }

  async function fetchMedia() {
    try {
      const response = await fetch(`/api/albums/${albumId}/media`);

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Get presigned URL
        const presignedResponse = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-user-id',
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            albumId,
          }),
        });

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, mediaId } = await presignedResponse.json();

        // Upload to R2
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        // Mark upload complete
        await fetch('/api/upload/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-user-id',
          },
          body: JSON.stringify({ mediaId }),
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Refresh media list
      await fetchMedia();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  const galleryUrl = album ? `${window.location.origin}/gallery/${album.slug}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {album?.title || 'Loading...'}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {album && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Share This Gallery</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={galleryUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={() => navigator.clipboard.writeText(galleryUrl)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy Link
              </button>
              <Link
                href={`/gallery/${album.slug}`}
                target="_blank"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Preview
              </Link>
            </div>
          </div>
        )}

        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Photos & Videos</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">
                Photos and videos up to 100MB each
              </p>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Gallery Media ({media.length})
          </h3>
          {media.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No media uploaded yet. Upload your first photos above!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map((item) => (
                <div key={item.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {item.type === 'photo' ? (
                    <Image
                      src={item.thumbnail_url || item.optimized_url || item.original_url}
                      alt={item.filename}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={item.original_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
