'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Album {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  view_count: number;
  created_at: string;
  media_count?: number;
}

export default function Dashboard() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    client_email: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  async function fetchAlbums() {
    try {
      // For MVP, using a simple auth token (replace with proper auth)
      const response = await fetch('/api/albums', {
        headers: {
          'Authorization': 'Bearer demo-user-id',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-user-id',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: '', client_name: '', client_email: '', password: '' });
        setShowCreateForm(false);
        await fetchAlbums();
      }
    } catch (error) {
      console.error('Error creating album:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gallery Dashboard</h1>
            <div className="flex gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <button className="text-gray-600 hover:text-gray-900">
                Account
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Your Albums</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            {showCreateForm ? 'Cancel' : '+ New Album'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Create New Album</h3>
            <form onSubmit={createAlbum} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Sarah & John Wedding"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Protection (optional)
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4-digit PIN"
                  maxLength={4}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Album'}
              </button>
            </form>
          </div>
        )}

        {loading && albums.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading albums...</p>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">No albums yet</p>
            <p className="text-gray-400">Create your first album to get started</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/dashboard/albums/${album.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{album.title}</h3>
                {album.client_name && (
                  <p className="text-gray-600 mb-4">{album.client_name}</p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{album.media_count || 0} photos</span>
                  <span>{album.view_count} views</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-blue-600 font-medium">
                    View Gallery →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
