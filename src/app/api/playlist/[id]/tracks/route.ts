import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { Playlist, PlaylistTrack } from '@/types';

// Mock data imports
import mockDatabase from '@/data/mock-music-database.json';

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
    const { trackIds }: { trackIds: string[] } = await request.json();

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        { error: 'Track IDs are required' },
        { status: 400 }
      );
    }

    // In a real app, validate playlist ownership and add tracks
    // const playlist = await db.playlist.findUnique({
    //   where: { id: playlistId },
    //   include: { tracks: true }
    // });

    // Mock playlist with new tracks added
    const newTracks: PlaylistTrack[] = trackIds.map((trackId, index) => {
      const mockTrack = mockDatabase.tracks.find(t => t.id === trackId) || mockDatabase.tracks[0];
      
      if (!mockTrack) {
        throw new Error('Required track data not found');
      }
      
      const mockArtist = mockDatabase.artists.find(a => a.id === mockTrack.artist) || mockDatabase.artists[0];
      const mockAlbum = mockDatabase.albums.find(a => a.id === mockTrack.album) || mockDatabase.albums[0];

      if (!mockArtist || !mockAlbum) {
        throw new Error('Required artist or album data not found');
      }

      return {
        id: `playlist-track-${playlistId}-${Date.now()}-${index}`,
        track: {
          id: mockTrack.id,
          title: mockTrack.title,
          artist: mockArtist,
          album: {
            id: mockAlbum.id,
            title: mockAlbum.title,
            artist: mockArtist,
            releaseDate: new Date(mockAlbum.releaseDate),
            totalTracks: mockAlbum.totalTracks,
            imageUrl: mockAlbum.imageUrl,
            genres: mockAlbum.genres,
            type: (mockAlbum.type as "album" | "single" | "compilation") || "album",
          },
          duration: mockTrack.duration,
          previewUrl: mockTrack.previewUrl,
          streamUrl: mockTrack.streamUrl,
          isExplicit: mockTrack.isExplicit,
          popularity: mockTrack.popularity,
          trackNumber: mockTrack.trackNumber,
          genres: mockTrack.genres,
          releaseDate: new Date(mockTrack.releaseDate),
          imageUrl: mockTrack.imageUrl,
        },
        addedAt: new Date(),
        addedBy: {
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
        position: index, // In real app, this would be current track count + index
      };
    });

    const updatedPlaylist: Playlist = {
      id: playlistId,
      name: "Updated Playlist",
      description: "Playlist with new tracks",
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
      tracks: newTracks,
      isPublic: true,
      collaborative: false,
      followers: 0,
      totalDuration: newTracks.reduce((sum, t) => sum + t.track.duration, 0),
      trackCount: newTracks.length,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      playCount: 0,
      isSmartPlaylist: false,
    };

    return NextResponse.json(updatedPlaylist);
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { trackIds }: { trackIds: string[] } = await request.json();

    if (!trackIds || !Array.isArray(trackIds)) {
      return NextResponse.json(
        { error: 'Track IDs are required' },
        { status: 400 }
      );
    }

    // In a real app, remove tracks from playlist
    // await db.playlistTrack.deleteMany({
    //   where: {
    //     playlistId,
    //     trackId: { in: trackIds }
    //   }
    // });

    // Mock updated playlist with tracks removed
    const updatedPlaylist: Playlist = {
      id: playlistId,
      name: "Updated Playlist",
      description: "Playlist with tracks removed",
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
      tracks: [], // Tracks removed
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
    console.error('Error removing tracks from playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}