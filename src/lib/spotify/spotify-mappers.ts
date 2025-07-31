import type { Track, Album, Artist, Playlist, User } from '@/types';
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
  const artist: Artist = {
    id: spotifyTrack.artists[0]?.id || '',
    name: spotifyTrack.artists[0]?.name || 'Unknown Artist',
    genres: [], // Not available in track response
    followers: 0, // Not available in track response
    isVerified: false, // Not available in track response
    popularity: 0, // Not available in track response
  };

  const album: Album = {
    id: spotifyTrack.album.id,
    title: spotifyTrack.album.name,
    artist: artist,
    releaseDate: new Date(spotifyTrack.album.release_date),
    totalTracks: spotifyTrack.album.total_tracks || 0,
    type: (spotifyTrack.album.album_type as 'album' | 'single' | 'compilation') || 'album',
    imageUrl: spotifyTrack.album.images[0]?.url || '/placeholder-album.png',
    genres: [], // Not available in track response
  };

  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: artist,
    album: album,
    duration: Math.floor(spotifyTrack.duration_ms / 1000), // Convert to seconds
    previewUrl: spotifyTrack.preview_url || undefined,
    streamUrl: spotifyTrack.preview_url || undefined, // Using preview URL as stream URL
    isExplicit: spotifyTrack.explicit,
    popularity: spotifyTrack.popularity,
    trackNumber: spotifyTrack.track_number,
    genres: [], // Not available in track response
    releaseDate: new Date(spotifyTrack.album.release_date),
    imageUrl: spotifyTrack.album.images[0]?.url || '/placeholder-album.png',
  };
}

/**
 * Map Spotify album to our Album interface
 */
export function mapSpotifyAlbum(spotifyAlbum: SpotifyAlbum): Album {
  const artist: Artist = {
    id: spotifyAlbum.artists[0]?.id || '',
    name: spotifyAlbum.artists[0]?.name || 'Unknown Artist',
    genres: [], // Not available in album response
    followers: 0, // Not available in album response
    isVerified: false, // Not available in album response
    popularity: 0, // Not available in album response
  };

  return {
    id: spotifyAlbum.id,
    title: spotifyAlbum.name,
    artist: artist,
    releaseDate: new Date(spotifyAlbum.release_date),
    totalTracks: spotifyAlbum.total_tracks,
    type: (spotifyAlbum.album_type as 'album' | 'single' | 'compilation') || 'album',
    imageUrl: spotifyAlbum.images[0]?.url || '/placeholder-album.png',
    genres: [], // Not available in album object
  };
}

/**
 * Map Spotify artist to our Artist interface
 */
export function mapSpotifyArtist(spotifyArtist: SpotifyArtist): Artist {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    imageUrl: spotifyArtist.images?.[0]?.url,
    genres: spotifyArtist.genres || [],
    followers: 0, // Not available in simple artist object
    /**
     * Artist verification status approximation
     * 
     * Spotify API doesn't provide a direct "verified" field.
     * We use popularity > 50 as a rough approximation:
     * - Most verified artists have higher popularity scores
     * - This is a temporary solution until proper verification data is available
     * 
     * TODO: Replace with actual verification data when available from Spotify API
     */
    isVerified: spotifyArtist.popularity > 50,
    popularity: spotifyArtist.popularity || 0
  };
}

/**
 * Map Spotify playlist to our Playlist interface
 */
export function mapSpotifyPlaylist(spotifyPlaylist: SpotifyPlaylist): Playlist {
  // Create a minimal user object for owner
  const owner: User = {
    id: spotifyPlaylist.owner.id,
    email: '', // Not available
    username: spotifyPlaylist.owner.id,
    displayName: spotifyPlaylist.owner.display_name || spotifyPlaylist.owner.id,
    isPremium: false, // Not available
    subscriptionTier: 'free', // Not available
    subscriptionStatus: 'active', // Not available
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    id: spotifyPlaylist.id,
    name: spotifyPlaylist.name,
    description: spotifyPlaylist.description || undefined,
    imageUrl: spotifyPlaylist.images?.[0]?.url || undefined,
    owner: owner,
    tracks: [], // Will be populated separately
    isPublic: spotifyPlaylist.public ?? true,
    collaborative: false, // Not available in basic playlist object
    followers: 0, // Not available in basic playlist object
    totalDuration: 0, // Will need to calculate from tracks
    trackCount: spotifyPlaylist.tracks.total || 0,
    tags: [], // Not available from Spotify
    folderId: undefined,
    createdAt: new Date(), // Not available from Spotify
    updatedAt: new Date(), // Not available from Spotify
    lastPlayedAt: undefined,
    playCount: 0, // Not available from Spotify
    shareUrl: spotifyPlaylist.external_urls?.spotify,
    isSmartPlaylist: false, // Spotify playlists are not smart playlists
    smartPlaylistCriteria: undefined,
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
    .map(item => mapSpotifyTrack(item.track as SpotifyTrack));
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
  return sorted[0]?.url || '/placeholder.png';
}