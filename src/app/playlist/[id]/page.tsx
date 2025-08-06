import { Suspense } from 'react';
import PlaylistDetailClient from './playlist-detail-client';
import { PlaylistSkeleton } from '@/components/skeletons/playlist-skeleton';
import { ErrorBoundaryWithFallback } from '@/components/common/error-boundary-with-fallback';
import Link from 'next/link';

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
    <ErrorBoundaryWithFallback
      fallback={
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Unable to load playlist</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading this playlist. Please try again.
          </p>
          <Link 
            href="/playlists" 
            className="text-green-500 hover:text-green-400 underline"
          >
            Back to playlists
          </Link>
        </div>
      }
    >
      <Suspense fallback={<PlaylistSkeleton />}>
        <PlaylistDetailClient playlistId={resolvedParams.id} />
      </Suspense>
    </ErrorBoundaryWithFallback>
  );
}