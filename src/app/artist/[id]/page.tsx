import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArtistDetailClient from './artist-detail-client';

interface ArtistPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Fetch artist data from API
 */
async function getArtistData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/artist/${id}`, {
      cache: 'force-cache',
    });
    
    if (!response.ok) {
      throw new Error('Artist not found');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error('Failed to fetch artist data');
  }
}

/**
 * Artist detail page with server-side rendering for SEO optimization
 */
export default async function ArtistPage({ params }: ArtistPageProps) {
  try {
    const resolvedParams = await params;
    const artist = await getArtistData(resolvedParams.id);
    
    return <ArtistDetailClient artist={artist} />;
  } catch (error) {
    console.error('Error loading artist:', error);
    notFound();
  }
}

/**
 * Generate metadata for SEO optimization
 */
export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const artist = await getArtistData(resolvedParams.id);
    
    return {
      title: `${artist.name} | Spotify MVP`,
      description: `Listen to ${artist.name}'s music on Spotify MVP. ${artist.bio ? artist.bio.slice(0, 150) + '...' : `${artist.followers.toLocaleString()} followers • ${artist.albums.length} albums • ${artist.topTracks.length} top tracks`}`,
      openGraph: {
        title: artist.name,
        description: artist.bio || `${artist.followers.toLocaleString()} followers • Listen to ${artist.name}'s top tracks and albums`,
        images: artist.imageUrl ? [
          {
            url: artist.imageUrl,
            width: 640,
            height: 640,
            alt: `${artist.name} photo`,
          }
        ] : [],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: artist.name,
        description: artist.bio || `${artist.followers.toLocaleString()} followers • Listen to ${artist.name}'s music`,
        images: artist.imageUrl ? [artist.imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Artist Not Found | Spotify MVP',
      description: 'The requested artist could not be found.',
    };
  }
}