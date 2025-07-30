import { Suspense } from 'react';
import LikedSongsClient from './liked-songs-client';

export const metadata = {
  title: 'Liked Songs | Spotify MVP',
  description: 'Your favorite songs in one place',
};

export default function LikedSongsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    }>
      <LikedSongsClient />
    </Suspense>
  );
}