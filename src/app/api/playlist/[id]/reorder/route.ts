import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { Playlist } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const playlistId = resolvedParams.id;
    const { startIndex, endIndex }: { startIndex: number; endIndex: number } = await request.json();

    if (typeof startIndex !== 'number' || typeof endIndex !== 'number') {
      return NextResponse.json(
        { error: 'Start and end indices are required' },
        { status: 400 }
      );
    }

    // In a real app, fetch playlist, verify ownership, and reorder tracks
    // const playlist = await db.playlist.findUnique({
    //   where: { id: playlistId },
    //   include: { tracks: { orderBy: { position: 'asc' } } }
    // });

    // if (!playlist || playlist.ownerId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: 'Playlist not found or unauthorized' },
    //     { status: 404 }
    //   );
    // }

    // Reorder logic would go here:
    // const tracks = [...playlist.tracks];
    // const [reorderedItem] = tracks.splice(startIndex, 1);
    // tracks.splice(endIndex, 0, reorderedItem);

    // Update positions in database
    // for (let i = 0; i < tracks.length; i++) {
    //   await db.playlistTrack.update({
    //     where: { id: tracks[i].id },
    //     data: { position: i }
    //   });
    // }

    // Mock response - return updated playlist
    const updatedPlaylist: Playlist = {
      id: playlistId,
      name: "Reordered Playlist",
      description: "Playlist with reordered tracks",
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
      tracks: [], // Would contain reordered tracks
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
    console.error('Error reordering playlist tracks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}