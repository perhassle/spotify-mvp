import { Suspense } from 'react';
import LikedSongsClient from './liked-songs-client';
import { LikedSongsSkeleton } from '@/components/skeletons/liked-songs-skeleton';

export const metadata = {
  title: 'Liked Songs | Spotify MVP',
  description: 'Your favorite songs in one place',
};

export default function LikedSongsPage() {
  return (
    <Suspense fallback={<LikedSongsSkeleton />}>
      <LikedSongsClient />
    </Suspense>
  );
}