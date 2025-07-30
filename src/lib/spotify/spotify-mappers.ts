import type { Track, Album, Artist, Playlist } from '@/types';
import type { 
  SpotifyTrack, 
  SpotifyAlbum, 
  SpotifyArtist, 
  SpotifyPlaylist,
  SpotifyPlaylistTrack 
} from './spotify-types';

/**
 * Map Spotify track to our Track interface
 */
export function mapSpotifyTrack(spotifyTrack: SpotifyTrack): Track {
  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists[0]?.name || 'Unknown Artist',
    artistId: spotifyTrack.artists[0]?.id || '',
    album: spotifyTrack.album.name,
    albumId: spotifyTrack.album.id,
    duration: spotifyTrack.duration_ms,
    coverUrl: spotifyTrack.album.images[0]?.url || '/placeholder-album.png',
    audioUrl: spotifyTrack.preview_url || '', // 30 second preview
    popularity: spotifyTrack.popularity,
    explicit: spotifyTrack.explicit,
    spotifyUri: spotifyTrack.uri,
  };
}

/**
 * Map Spotify album to our Album interface
 */
export function mapSpotifyAlbum(spotifyAlbum: SpotifyAlbum): Album {
  return {
    id: spotifyAlbum.id,
    title: spotifyAlbum.name,
    artist: spotifyAlbum.artists[0]?.name || 'Unknown Artist',
    artistId: spotifyAlbum.artists[0]?.id || '',
    coverUrl: spotifyAlbum.images[0]?.url || '/placeholder-album.png',
    releaseYear: new Date(spotifyAlbum.release_date).getFullYear(),
    trackCount: spotifyAlbum.total_tracks,
    tracks: [], // Will be populated separately
    type: spotifyAlbum.album_type,
    spotifyUri: spotifyAlbum.uri,
  };
}

/**
 * Map Spotify artist to our Artist interface
 */
export function mapSpotifyArtist(spotifyArtist: SpotifyArtist): Artist {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    imageUrl: spotifyArtist.images[0]?.url || '/placeholder-artist.png',
    genres: spotifyArtist.genres,
    followers: 0, // Not provided in basic artist object
    monthlyListeners: 0, // Not available via API
    bio: '', // Not available via basic API
    verified: spotifyArtist.popularity > 50, // Approximation
    spotifyUri: spotifyArtist.uri,
  };
}

/**
 * Map Spotify playlist to our Playlist interface
 */
export function mapSpotifyPlaylist(spotifyPlaylist: SpotifyPlaylist): Playlist {
  return {
    id: spotifyPlaylist.id,
    name: spotifyPlaylist.name,
    description: spotifyPlaylist.description || '',
    coverUrl: spotifyPlaylist.images[0]?.url || '/placeholder-playlist.png',
    trackCount: spotifyPlaylist.tracks.total,
    duration: 0, // Will need to calculate from tracks
    isPublic: spotifyPlaylist.public,
    owner: {
      id: spotifyPlaylist.owner.id,
      name: spotifyPlaylist.owner.display_name,
    },
    tracks: [], // Will be populated separately
    followers: 0, // Not in basic response
    createdAt: new Date().toISOString(), // Not available
    updatedAt: new Date().toISOString(), // Not available
    spotifyUri: spotifyPlaylist.uri,
  };
}

/**
 * Map array of Spotify tracks
 */
export function mapSpotifyTracks(spotifyTracks: SpotifyTrack[]): Track[] {
  return spotifyTracks.map(mapSpotifyTrack);
}

/**
 * Map array of Spotify playlist tracks (includes metadata)
 */
export function mapSpotifyPlaylistTracks(items: SpotifyPlaylistTrack[]): Track[] {
  return items
    .filter(item => item.track && item.track.type === 'track')
    .map(item => mapSpotifyTrack(item.track));
}

/**
 * Calculate total duration from tracks
 */
export function calculatePlaylistDuration(tracks: Track[]): number {
  return tracks.reduce((total, track) => total + track.duration, 0);
}

/**
 * Format duration from milliseconds to readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
}

/**
 * Get highest quality image from Spotify images array
 */
export function getBestImage(images: { url: string; width: number | null; height: number | null }[]): string {
  if (!images || images.length === 0) {
    return '/placeholder.png';
  }
  
  // Sort by width (largest first) and return the URL
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0].url;
}