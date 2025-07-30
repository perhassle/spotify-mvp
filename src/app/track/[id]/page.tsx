import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TrackDetailClient from './track-detail-client';

interface TrackPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Fetch track data from API
 */
async function getTrackData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/track/${id}`, {
      cache: 'force-cache',
    });
    
    if (!response.ok) {
      throw new Error('Track not found');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error('Failed to fetch track data');
  }
}

/**
 * Track detail page with server-side rendering for SEO optimization
 */
export default async function TrackPage({ params }: TrackPageProps) {
  try {
    const resolvedParams = await params;
    const track = await getTrackData(resolvedParams.id);
    
    return <TrackDetailClient track={track} />;
  } catch (error) {
    console.error('Error loading track:', error);
    notFound();
  }
}

/**
 * Generate metadata for SEO optimization
 */
export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const track = await getTrackData(resolvedParams.id);
    
    return {
      title: `${track.title} by ${track.artist.name} | Spotify MVP`,
      description: `Listen to ${track.title} by ${track.artist.name} from the album ${track.album.title}. ${track.genres.join(', ')} • ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
      openGraph: {
        title: `${track.title} by ${track.artist.name}`,
        description: `From the album ${track.album.title} • Listen now on Spotify MVP`,
        images: track.imageUrl ? [
          {
            url: track.imageUrl,
            width: 640,
            height: 640,
            alt: `${track.title} album artwork`,
          }
        ] : [],
        type: 'music.song',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${track.title} by ${track.artist.name}`,
        description: `From ${track.album.title} • Listen now on Spotify MVP`,
        images: track.imageUrl ? [track.imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Track Not Found | Spotify MVP',
      description: 'The requested track could not be found.',
    };
  }
}