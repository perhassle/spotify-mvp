import { Suspense } from 'react';
import PlaylistDetailClient from './playlist-detail-client';
import { PlaylistSkeleton } from '@/components/skeletons/playlist-skeleton';

interface PlaylistPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PlaylistPageProps) {
  const _resolvedParams = await params;
  // In a real app, fetch playlist data for metadata
  return {
    title: `Playlist | Spotify MVP`,
    description: 'Listen to your curated playlist',
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<PlaylistSkeleton />}>
      <PlaylistDetailClient playlistId={resolvedParams.id} />
    </Suspense>
  );
}