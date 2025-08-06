import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { PlaylistCreateRequest, Playlist, User } from '@/types';
import { 
  createSuccessResponse, 
  unauthorized, 
  getRequestPath 
} from '@/lib/api/error-responses';
import { 
  validateRequest, 
  playlistCreateSchema 
} from '@/lib/api/validate-request';
import { withStandardMiddleware } from '@/lib/api/middleware';

// Mock data imports - replace with actual database calls
import mockDatabase from '@/data/mock-music-database.json';

async function createPlaylistHandler(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const path = getRequestPath(request);
  
  if (!session?.user) {
    return unauthorized('Authentication required to create playlists', undefined, path);
  }

  const body = await request.json();
  const validation = validateRequest(playlistCreateSchema)(body, request);
  
  if ('error' in validation) {
    return validation.error;
  }

  const { name, description, isPublic, collaborative, tags, folderId, templateId } = validation.data;

  // Generate unique ID
  const playlistId = `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create mock user object from session
  const owner: User = {
    id: session.user.id || 'user-1',
    email: session.user.email || '',
    username: session.user.name || 'User',
    displayName: session.user.name || 'User',
    profileImage: session.user.image || "/images/placeholder-avatar.png",
    isPremium: false,
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create new playlist
  const newPlaylist: Playlist = {
    id: playlistId,
    name: name.trim(),
    description: description?.trim() || undefined,
    imageUrl: undefined, // Will be updated if image is uploaded
    owner,
    tracks: [],
    isPublic: isPublic ?? false,
    collaborative: collaborative ?? false,
    followers: 0,
    totalDuration: 0,
    trackCount: 0,
    tags: tags || [],
    folderId: folderId || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    playCount: 0,
    isSmartPlaylist: false,
  };

  // If template is specified, add template tracks
  if (templateId) {
    // Mock template implementation - add some sample tracks
    const sampleTracks = mockDatabase.tracks.slice(0, 5).map((track, index) => {
      const mockArtist = mockDatabase.artists.find(a => a.id === track.artist) || mockDatabase.artists[0];
      const mockAlbum = mockDatabase.albums.find(a => a.id === track.album) || mockDatabase.albums[0];

      if (!mockArtist || !mockAlbum) {
        throw new Error('Required artist or album data not found');
      }

      return {
        id: `playlist-track-${playlistId}-${index}`,
        track: {
          id: track.id,
          title: track.title,
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
          duration: track.duration,
          previewUrl: track.previewUrl,
          streamUrl: track.streamUrl,
          isExplicit: track.isExplicit,
          popularity: track.popularity,
          trackNumber: track.trackNumber,
          genres: track.genres,
          releaseDate: new Date(track.releaseDate),
          imageUrl: track.imageUrl,
        },
        addedAt: new Date(),
        addedBy: owner,
        position: index,
      };
    });

    newPlaylist.tracks = sampleTracks;
    newPlaylist.trackCount = sampleTracks.length;
    newPlaylist.totalDuration = sampleTracks.reduce((sum, t) => sum + t.track.duration, 0);
  }

  // In a real app, save to database here
  // await db.playlist.create({ data: newPlaylist });

  return createSuccessResponse(newPlaylist);
}

export const POST = withStandardMiddleware(createPlaylistHandler);