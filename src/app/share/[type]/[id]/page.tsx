import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SharePreviewClient from './share-preview-client';

interface SharePreviewPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
  searchParams: Promise<{
    ref?: string;
  }>;
}

// Mock function to get content for meta tags
async function getContentForMetadata(type: string, id: string) {
  // This would normally query your database
  const contentMap = {
    track: {
      title: `Track ${id}`,
      description: 'Listen to this amazing track on Spotify MVP',
      imageUrl: '/images/placeholder-album.png',
    },
    album: {
      title: `Album ${id}`,
      description: 'Check out this incredible album on Spotify MVP',
      imageUrl: '/images/placeholder-album.png',
    },
    playlist: {
      title: `Playlist ${id}`,
      description: 'Discover new music with this curated playlist',
      imageUrl: '/images/placeholder-album.png',
    },
    artist: {
      title: `Artist ${id}`,
      description: 'Explore this amazing artist on Spotify MVP',
      imageUrl: '/images/placeholder-artist.png',
    },
  };

  return contentMap[type as keyof typeof contentMap] || null;
}

export async function generateMetadata({
  params,
  searchParams,
}: SharePreviewPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const _resolvedSearchParams = await searchParams;
  const { type, id } = resolvedParams;
  const content = await getContentForMetadata(type, id);

  if (!content) {
    return {
      title: 'Content Not Found - Spotify MVP',
      description: 'The shared content could not be found.',
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share/${type}/${id}`;

  return {
    title: `${content.title} - Spotify MVP`,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'website',
      url: shareUrl,
      images: [
        {
          url: content.imageUrl,
          width: 1200,
          height: 630,
          alt: content.title,
        },
      ],
      siteName: 'Spotify MVP',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [content.imageUrl],
      creator: '@spotify_mvp',
    },
    other: Object.fromEntries(
      Object.entries({
        'music:song': type === 'track' ? shareUrl : undefined,
        'music:album': type === 'album' ? shareUrl : undefined,
        'music:playlist': type === 'playlist' ? shareUrl : undefined,
        'music:musician': type === 'artist' ? shareUrl : undefined,
      }).filter(([, value]) => value !== undefined) as [string, string][]
    ),
  };
}

export default async function SharePreviewPage({ params, searchParams }: SharePreviewPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { type, id } = resolvedParams;
  const { ref } = resolvedSearchParams;

  // Validate content type
  if (!['track', 'album', 'playlist', 'artist'].includes(type)) {
    notFound();
  }

  return (
    <SharePreviewClient
      contentType={type as 'track' | 'album' | 'playlist' | 'artist'}
      contentId={id}
      referrer={ref}
    />
  );
}