import { Suspense } from 'react';
import PlaylistsPageClient from './playlists-page-client';
import { PlaylistsSkeleton } from '@/components/skeletons/playlists-skeleton';

export const metadata = {
  title: 'Your Library - Playlists | Spotify MVP',
  description: 'Manage and organize your music playlists',
};

export default function PlaylistsPage() {
  return (
    <Suspense fallback={<PlaylistsSkeleton />}>
      <PlaylistsPageClient />
    </Suspense>
  );
}