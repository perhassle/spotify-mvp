import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { FollowedArtist, ArtistFollowStats, FollowingNotification } from '@/types';

// Mock database for following relationships
const followedArtists: FollowedArtist[] = [];
const artistFollowStats: Record<string, ArtistFollowStats> = {};

// Mock function to get artist data
async function getArtistById(artistId: string) {
  // This would normally come from your music database
  return {
    id: artistId,
    name: `Artist ${artistId}`,
    bio: `Bio for artist ${artistId}`,
    imageUrl: '/images/placeholder-artist.png',
    genres: ['Pop', 'Rock'],
    followers: artistFollowStats[artistId]?.followerCount || Math.floor(Math.random() * 100000),
    isVerified: true,
    popularity: 85
  };
}

// Mock function to create notification
async function createFollowNotification(userId: string, artistId: string, type: 'followed' | 'new_release') {
  const artist = await getArtistById(artistId);
  const notification: FollowingNotification = {
    id: `notification-${Date.now()}-${Math.random()}`,
    userId,
    artistId,
    artist,
    type: type === 'followed' ? 'artist_milestone' : 'new_release',
    title: type === 'followed' ? 'New Follower!' : 'New Release',
    message: type === 'followed' 
      ? `You now follow ${artist.name}` 
      : `${artist.name} released a new track`,
    actionUrl: `/artist/${artistId}`,
    imageUrl: artist.imageUrl,
    isRead: false,
    createdAt: new Date(),
  };
  
  // Store notification (in real app, save to database)
  console.log('Created notification:', notification);
  return notification;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const userId = session.user.email; // Using email as user ID for simplicity

    // Check if already following
    const existingFollow = followedArtists.find(
      f => f.userId === userId && f.artistId === artistId
    );

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this artist' },
        { status: 400 }
      );
    }

    // Create new follow relationship
    const followedArtist: FollowedArtist = {
      id: `follow-${Date.now()}-${Math.random()}`,
      userId,
      artistId,
      followedAt: new Date(),
      notificationsEnabled: true,
    };

    followedArtists.push(followedArtist);

    // Update artist stats
    if (!artistFollowStats[artistId]) {
      const artist = await getArtistById(artistId);
      artistFollowStats[artistId] = {
        artistId,
        followerCount: artist.followers + 1,
        followingCount: 0, // Artists don't follow others in this context
        totalPlays: Math.floor(Math.random() * 1000000),
        monthlyListeners: Math.floor(Math.random() * 500000),
        isFollowing: true,
      };
    } else {
      artistFollowStats[artistId].followerCount += 1;
      artistFollowStats[artistId].isFollowing = true;
    }

    // Create follow notification
    await createFollowNotification(userId, artistId, 'followed');

    return NextResponse.json({
      success: true,
      data: {
        followedArtist,
        stats: artistFollowStats[artistId],
      },
    });

  } catch (error) {
    console.error('Error following artist:', error);
    return NextResponse.json(
      { error: 'Failed to follow artist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    const userId = session.user.email;

    // Find and remove follow relationship
    const followIndex = followedArtists.findIndex(
      f => f.userId === userId && f.artistId === artistId
    );

    if (followIndex === -1) {
      return NextResponse.json(
        { error: 'Not following this artist' },
        { status: 400 }
      );
    }

    followedArtists.splice(followIndex, 1);

    // Update artist stats
    if (artistFollowStats[artistId]) {
      artistFollowStats[artistId].followerCount = Math.max(0, artistFollowStats[artistId].followerCount - 1);
      artistFollowStats[artistId].isFollowing = false;
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: artistFollowStats[artistId] || {
          artistId,
          followerCount: 0,
          followingCount: 0,
          totalPlays: 0,
          monthlyListeners: 0,
          isFollowing: false,
        },
      },
    });

  } catch (error) {
    console.error('Error unfollowing artist:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow artist' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const resolvedParams = await params;
    const artistId = resolvedParams.id;
    
    let isFollowing = false;
    if (session?.user?.email) {
      const followRelation = followedArtists.find(
        f => f.userId === session.user.email && f.artistId === artistId
      );
      isFollowing = !!followRelation;
    }

    // Get or create artist stats
    if (!artistFollowStats[artistId]) {
      const artist = await getArtistById(artistId);
      artistFollowStats[artistId] = {
        artistId,
        followerCount: artist.followers,
        followingCount: 0,
        totalPlays: Math.floor(Math.random() * 1000000),
        monthlyListeners: Math.floor(Math.random() * 500000),
        isFollowing,
      };
    } else {
      artistFollowStats[artistId].isFollowing = isFollowing;
    }

    return NextResponse.json({
      success: true,
      data: artistFollowStats[artistId],
    });

  } catch (error) {
    console.error('Error getting artist follow status:', error);
    return NextResponse.json(
      { error: 'Failed to get follow status' },
      { status: 500 }
    );
  }
}