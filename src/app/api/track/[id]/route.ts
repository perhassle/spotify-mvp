import { NextRequest, NextResponse } from 'next/server';
import mockDatabase from '@/data/mock-music-database.json';
import type { Track, Artist, Album } from '@/types';

interface TrackDetails extends Track {
  relatedTracks: Track[];
  albumTracks: Track[];
  artistTopTracks: Track[];
}

interface TrackParams {
  id: string;
}

/**
 * GET /api/track/[id]
 * Retrieves detailed information about a specific track including related content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TrackParams> }
) {
  try {
    const resolvedParams = await params;
const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    // Find track in mock database
    const track = mockDatabase.tracks.find(t => t.id === id);
    
    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Find artist information
    const artist = mockDatabase.artists.find(a => a.id === track.artist);
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found for this track' },
        { status: 404 }
      );
    }

    // Find album information
    const album = mockDatabase.albums.find(a => a.id === track.album);
    
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found for this track' },
        { status: 404 }
      );
    }

    // Get album tracks (other tracks from the same album)
    const albumTracks = mockDatabase.tracks
      .filter(t => t.album === track.album && t.id !== track.id)
      .map(t => {
        const trackArtist = mockDatabase.artists.find(a => a.id === t.artist);
        return {
          ...t,
          artist: trackArtist || artist,
          album: {
            id: album.id,
            title: album.title,
            artist: artist,
            releaseDate: new Date(album.releaseDate),
            totalTracks: album.totalTracks,
            imageUrl: album.imageUrl,
            genres: album.genres,
            type: (album.type as "album" | "single" | "compilation") || "album",
          },
          releaseDate: new Date(t.releaseDate),
          genres: t.genres || [],
        };
      })
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
      .slice(0, 10);

    // Get artist's top tracks (excluding current track)
    const artistTopTracks = mockDatabase.tracks
      .filter(t => t.artist === track.artist && t.id !== track.id)
      .map(t => {
        const trackAlbum = mockDatabase.albums.find(a => a.id === t.album);
        return {
          ...t,
          artist: artist,
          album: trackAlbum ? {
            id: trackAlbum.id,
            title: trackAlbum.title,
            artist: artist,
            releaseDate: new Date(trackAlbum.releaseDate),
            totalTracks: trackAlbum.totalTracks,
            imageUrl: trackAlbum.imageUrl,
            genres: trackAlbum.genres,
            type: (trackAlbum.type as "album" | "single" | "compilation") || "album",
          } : {
            id: 'unknown',
            title: 'Unknown Album',
            artist: artist,
            releaseDate: new Date(),
            totalTracks: 1,
            genres: [],
            type: 'album' as const,
          },
          releaseDate: new Date(t.releaseDate),
          genres: t.genres || [],
        };
      })
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    // Get related tracks (similar genres, excluding current track and artist's tracks)
    const relatedTracks = mockDatabase.tracks
      .filter(t => 
        t.id !== track.id && 
        t.artist !== track.artist &&
        t.genres.some(genre => track.genres.includes(genre))
      )
      .map(t => {
        const trackArtist = mockDatabase.artists.find(a => a.id === t.artist);
        const trackAlbum = mockDatabase.albums.find(a => a.id === t.album);
        return {
          ...t,
          artist: trackArtist || {
            id: 'unknown',
            name: 'Unknown Artist',
            genres: [],
            followers: 0,
            isVerified: false,
            popularity: 0,
          },
          album: trackAlbum ? {
            id: trackAlbum.id,
            title: trackAlbum.title,
            artist: trackArtist || artist,
            releaseDate: new Date(trackAlbum.releaseDate),
            totalTracks: trackAlbum.totalTracks,
            imageUrl: trackAlbum.imageUrl,
            genres: trackAlbum.genres,
            type: (trackAlbum.type as "album" | "single" | "compilation") || "album",
          } : {
            id: 'unknown',
            title: 'Unknown Album',
            artist: trackArtist || artist,
            releaseDate: new Date(),
            totalTracks: 1,
            genres: [],
            type: 'album' as const,
          },
          releaseDate: new Date(t.releaseDate),
          genres: t.genres || [],
        };
      })
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 8);

    const trackDetails: TrackDetails = {
      ...track,
      artist: artist,
      album: {
        id: album.id,
        title: album.title,
        artist: artist,
        releaseDate: new Date(album.releaseDate),
        totalTracks: album.totalTracks,
        imageUrl: album.imageUrl,
        genres: album.genres,
        type: (album.type as "album" | "single" | "compilation") || "album",
      },
      releaseDate: new Date(track.releaseDate),
      genres: track.genres || [],
      relatedTracks,
      albumTracks,
      artistTopTracks,
    };

    return NextResponse.json({
      success: true,
      data: trackDetails,
    });

  } catch (error) {
    console.error('Error fetching track details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Utility function to get track with related content
 */
async function getTrackWithRelated(trackId: string): Promise<TrackDetails> {
  const track = mockDatabase.tracks.find(t => t.id === trackId);
  
  if (!track) {
    throw new Error('Track not found');
  }

  const artist = mockDatabase.artists.find(a => a.id === track.artist);
  const album = mockDatabase.albums.find(a => a.id === track.album);
  
  if (!artist || !album) {
    throw new Error('Artist or album not found for this track');
  }

  // Implementation details same as above...
  // (This is simplified for brevity)
  
  return {
    ...track,
    artist: artist,
    album: {
      id: album.id,
      title: album.title,
      artist: artist,
      releaseDate: new Date(album.releaseDate),
      totalTracks: album.totalTracks,
      imageUrl: album.imageUrl,
      genres: album.genres,
      type: (album.type as "album" | "single" | "compilation") || "album",
    },
    releaseDate: new Date(track.releaseDate),
    genres: track.genres || [],
    relatedTracks: [],
    albumTracks: [],
    artistTopTracks: [],
  };
}