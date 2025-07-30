import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { FollowedArtist, Artist } from '@/types';

// Mock database - in real app, this would be your database
const followedArtists: FollowedArtist[] = [];

// Mock function to get artist details
async function getArtistDetails(artistId: string): Promise<Artist> {
  // This would normally query your music database
  return {
    id: artistId,
    name: `Artist ${artistId}`,
    bio: `Bio for artist ${artistId}`,
    imageUrl: '/images/placeholder-artist.png',
    genres: ['Pop', 'Rock', 'Electronic'],
    followers: Math.floor(Math.random() * 100000) + 10000,
    isVerified: Math.random() > 0.3,
    popularity: Math.floor(Math.random() * 100) + 1
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's followed artists
    const userFollowedArtists = followedArtists
      .filter(f => f.userId === userId)
      .sort((a, b) => b.followedAt.getTime() - a.followedAt.getTime())
      .slice(offset, offset + limit);

    // Get artist details for each followed artist
    const artistsWithDetails = await Promise.all(
      userFollowedArtists.map(async (followedArtist) => {
        const artistDetails = await getArtistDetails(followedArtist.artistId);
        return {
          ...followedArtist,
          artist: artistDetails,
        };
      })
    );

    // Calculate pagination info
    const totalFollowed = followedArtists.filter(f => f.userId === userId).length;
    const hasMore = offset + limit < totalFollowed;

    return NextResponse.json({
      success: true,
      data: {
        followedArtists: artistsWithDetails,
        pagination: {
          limit,
          offset,
          total: totalFollowed,
          hasMore,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching followed artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followed artists' },
      { status: 500 }
    );
  }
}