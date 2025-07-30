import { NextRequest, NextResponse } from 'next/server';
import mockDatabase from '@/data/mock-music-database.json';
import type { Artist, Album, Track } from '@/types';

interface ArtistDetails extends Artist {
  albums: Album[];
  topTracks: Track[];
  totalPlayTime: number;
  monthlyListeners: number;
}

interface ArtistParams {
  id: string;
}

/**
 * GET /api/artist/[id]
 * Retrieves detailed information about a specific artist
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<ArtistParams> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Artist ID is required' },
        { status: 400 }
      );
    }

    // Find artist in mock database
    const artist = mockDatabase.artists.find(a => a.id === id);
    
    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Get artist's albums
    const artistAlbums = mockDatabase.albums
      .filter(album => album.artist === id)
      .map(album => ({
        ...album,
        artist: artist,
        releaseDate: new Date(album.releaseDate),
        type: album.type as "album" | "single" | "compilation",
      }))
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

    // Get artist's tracks with album information
    const artistTracks = mockDatabase.tracks
      .filter(track => track.artist === id)
      .map(track => {
        const trackAlbum = mockDatabase.albums.find(album => album.id === track.album);
        return {
          ...track,
          artist: artist,
          album: trackAlbum ? {
            ...trackAlbum,
            artist: artist,
            releaseDate: new Date(trackAlbum.releaseDate),
            type: trackAlbum.type as "album" | "single" | "compilation",
          } : {
            id: 'unknown',
            title: 'Unknown Album',
            artist: artist,
            releaseDate: new Date(),
            totalTracks: 1,
            genres: [],
            type: 'album' as const,
          },
          releaseDate: new Date(track.releaseDate),
          genres: track.genres || [],
        };
      })
      .sort((a, b) => b.popularity - a.popularity);

    // Get top tracks (limited to 10)
    const topTracks = artistTracks.slice(0, 10);

    // Calculate total play time (mock calculation)
    const totalPlayTime = artistTracks.reduce((total, track) => total + track.duration, 0);

    // Mock monthly listeners (derived from popularity and followers)
    const monthlyListeners = Math.floor(artist.followers * 0.15);

    const artistDetails: ArtistDetails = {
      ...artist,
      albums: artistAlbums,
      topTracks,
      totalPlayTime,
      monthlyListeners,
    };

    return NextResponse.json({
      success: true,
      data: artistDetails,
    });

  } catch (error) {
    console.error('Error fetching artist details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

