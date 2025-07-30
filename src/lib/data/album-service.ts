import mockDatabase from '@/data/mock-music-database.json';
import type { Album, Track, Artist } from '@/types';

export interface AlbumDetails extends Album {
  tracks: Track[];
  totalDuration: number;
  averagePopularity: number;
}

/**
 * Utility function to get album with tracks
 */
export async function getAlbumWithTracks(albumId: string): Promise<AlbumDetails> {
  const album = mockDatabase.albums.find(a => a.id === albumId);
  
  if (!album) {
    throw new Error('Album not found');
  }

  // Find artist information
  const artist = mockDatabase.artists.find(a => a.id === album.artist);
  
  if (!artist) {
    throw new Error('Artist not found for this album');
  }

  // Get album tracks
  const albumTracks = mockDatabase.tracks
    .filter(track => track.album === albumId)
    .map(track => ({
      ...track,
      artist: artist,
      album: {
        ...album,
        artist: artist,
        releaseDate: new Date(album.releaseDate),
        type: (album.type as "album" | "single" | "compilation") || "album",
      },
      releaseDate: new Date(track.releaseDate),
      genres: track.genres || [],
    }))
    .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

  const totalDuration = albumTracks.reduce((total, track) => total + track.duration, 0);
  const averagePopularity = albumTracks.length > 0 
    ? albumTracks.reduce((sum, track) => sum + track.popularity, 0) / albumTracks.length
    : 0;

  const albumDetails: AlbumDetails = {
    ...album,
    artist: artist,
    releaseDate: new Date(album.releaseDate),
    type: (album.type as "album" | "single" | "compilation") || "album",
    tracks: albumTracks,
    totalDuration,
    averagePopularity,
  };

  return albumDetails;
}