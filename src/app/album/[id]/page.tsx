import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AlbumDetailClient from './album-detail-client';
import { dataService } from '@/lib/data/data-service';

interface AlbumPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Album detail page with server-side rendering for SEO optimization
 */
export default async function AlbumPage({ params }: AlbumPageProps) {
  try {
    const resolvedParams = await params;
    const album = await dataService.getAlbumWithTracks(resolvedParams.id);
    
    return <AlbumDetailClient album={album} />;
  } catch (_error) {
    console.error('Error loading album:', _error);
    notFound();
  }
}

/**
 * Generate metadata for SEO optimization
 */
export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const album = await dataService.getAlbumWithTracks(resolvedParams.id);
    
    return {
      title: `${album.title} by ${album.artist.name} | Spotify MVP`,
      description: `Listen to ${album.title} by ${album.artist.name}. Album with ${album.totalTracks} tracks including ${album.tracks.slice(0, 3).map(t => t.title).join(', ')}.`,
      openGraph: {
        title: `${album.title} by ${album.artist.name}`,
        description: `Album with ${album.totalTracks} tracks. Listen now on Spotify MVP.`,
        images: album.imageUrl ? [
          {
            url: album.imageUrl,
            width: 640,
            height: 640,
            alt: `${album.title} album artwork`,
          }
        ] : [],
        type: 'music.album',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${album.title} by ${album.artist.name}`,
        description: `Album with ${album.totalTracks} tracks. Listen now on Spotify MVP.`,
        images: album.imageUrl ? [album.imageUrl] : [],
      },
    };
  } catch (_error) {
    return {
      title: 'Album Not Found | Spotify MVP',
      description: 'The requested album could not be found.',
    };
  }
}