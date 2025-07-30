import { Suspense } from 'react';
import PlaylistsPageClient from './playlists-page-client';

export const metadata = {
  title: 'Your Library - Playlists | Spotify MVP',
  description: 'Manage and organize your music playlists',
};

export default function PlaylistsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    }>
      <PlaylistsPageClient />
    </Suspense>
  );
}