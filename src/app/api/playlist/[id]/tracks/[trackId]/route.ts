import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { Playlist } from '@/types';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
const { id: playlistId, trackId } = resolvedParams;

    // In a real app, check playlist ownership and remove specific track
    // const playlist = await db.playlist.findUnique({
    //   where: { id: playlistId },
    //   include: { tracks: true }
    // });

    // if (!playlist || playlist.ownerId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: 'Playlist not found or unauthorized' },
    //     { status: 404 }
    //   );
    // }

    // await db.playlistTrack.deleteMany({
    //   where: {
    //     playlistId,
    //     trackId
    //   }
    // });

    // Mock updated playlist with specific track removed
    const updatedPlaylist: Playlist = {
      id: playlistId,
      name: "Updated Playlist",
      description: "Playlist with track removed",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      owner: {
        id: session.user.id || "user-1",
        email: session.user.email || "",
        username: session.user.name || "User",
        displayName: session.user.name || "User",
        profileImage: session.user.image || "/images/placeholder-avatar.png",
        isPremium: false,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tracks: [], // Track removed
      isPublic: true,
      collaborative: false,
      followers: 0,
      totalDuration: 0,
      trackCount: 0,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      playCount: 0,
      isSmartPlaylist: false,
    };

    return NextResponse.json(updatedPlaylist);
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}