import { Suspense } from 'react';
import PlaylistsPageClient from './playlists-page-client';
import { PlaylistGridSkeleton } from '@/components/features/playlist/playlist-card-skeleton';

export const metadata = {
  title: 'Your Library - Playlists | Spotify MVP',
  description: 'Manage and organize your music playlists',
};

export default function PlaylistsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white p-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
        </div>
        <PlaylistGridSkeleton count={12} />
      </div>
    }>
      <PlaylistsPageClient />
    </Suspense>
  );
}