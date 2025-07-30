import { Suspense } from 'react';
import PlaylistDetailClient from './playlist-detail-client';

interface PlaylistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PlaylistPageProps) {
  const resolvedParams = await params;
  // In a real app, fetch playlist data for metadata
  return {
    title: `Playlist | Spotify MVP`,
    description: 'Listen to your curated playlist',
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    }>
      <PlaylistDetailClient playlistId={resolvedParams.id} />
    </Suspense>
  );
}