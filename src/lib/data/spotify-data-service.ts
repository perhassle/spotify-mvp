import type { Track, Artist, Album } from '@/types';
import { SpotifyClient } from '@/lib/spotify/spotify-client';
import { mapSpotifyTrack, mapSpotifyArtist, mapSpotifyAlbum } from '@/lib/spotify/spotify-mappers';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum } from '@/lib/spotify/spotify-types';

class SpotifyDataService {
  private client: SpotifyClient;

  constructor() {
    this.client = new SpotifyClient();
  }

  async getAllTracks(): Promise<Track[]> {
    // This would be too expensive with real API, return popular tracks instead
    return this.getPopularTracks(50);
  }

  async getTrack(id: string): Promise<Track | null> {
    try {
      const spotifyTrack = await this.client.getTrack(id);
      return mapSpotifyTrack(spotifyTrack);
    } catch (error) {
      console.error('Error fetching track:', error);
      return null;
    }
  }

  async getTracks(ids: string[]): Promise<Track[]> {
    try {
      const spotifyTracks = await this.client.getTracks(ids);
      return spotifyTracks.tracks.map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }

  async getAllArtists(): Promise<Artist[]> {
    // This would be too expensive with real API, return empty array
    return [];
  }

  async getArtist(id: string): Promise<Artist | null> {
    try {
      const spotifyArtist = await this.client.getArtist(id);
      return mapSpotifyArtist(spotifyArtist);
    } catch (error) {
      console.error('Error fetching artist:', error);
      return null;
    }
  }

  async getArtists(ids: string[]): Promise<Artist[]> {
    try {
      const spotifyArtists = await this.client.getArtists(ids);
      return spotifyArtists.artists.map(mapSpotifyArtist);
    } catch (error) {
      console.error('Error fetching artists:', error);
      return [];
    }
  }

  async getAllAlbums(): Promise<Album[]> {
    // This would be too expensive with real API, return new releases instead
    return this.getNewReleaseAlbums(20);
  }

  async getAlbum(id: string): Promise<Album | null> {
    try {
      const spotifyAlbum = await this.client.getAlbum(id);
      return mapSpotifyAlbum(spotifyAlbum);
    } catch (error) {
      console.error('Error fetching album:', error);
      return null;
    }
  }

  async getAlbums(ids: string[]): Promise<Album[]> {
    try {
      const spotifyAlbums = await this.client.getAlbums(ids);
      return spotifyAlbums.albums.map(mapSpotifyAlbum);
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  async getTracksByGenres(genres: string[]): Promise<Track[]> {
    // Spotify doesn't have direct genre filtering for tracks
    // Use search with genre seeds
    try {
      const promises = genres.slice(0, 3).map(genre => 
        this.client.searchTracks(`genre:${genre}`, 20)
      );
      const results = await Promise.all(promises);
      const tracks = results.flatMap(result => result.tracks.items.map(mapSpotifyTrack));
      
      // Remove duplicates
      const uniqueTracks = Array.from(
        new Map(tracks.map(track => [track.id, track])).values()
      );
      
      return uniqueTracks;
    } catch (error) {
      console.error('Error searching tracks by genre:', error);
      return [];
    }
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      const topTracks = await this.client.getArtistTopTracks(artistId);
      return topTracks.tracks.map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error fetching artist tracks:', error);
      return [];
    }
  }

  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    try {
      const albumTracks = await this.client.getAlbumTracks(albumId);
      // Album tracks need to be enriched with full track data
      const trackIds = albumTracks.items.map(track => track.id);
      const fullTracks = await this.client.getTracks(trackIds);
      return fullTracks.tracks.map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      return [];
    }
  }

  async getPopularTracks(limit = 50): Promise<Track[]> {
    try {
      // Get tracks from top playlists
      const topLists = await this.client.getFeaturedPlaylists(1);
      if (topLists.playlists.items.length === 0) return [];
      
      const playlistTracks = await this.client.getPlaylistTracks(
        topLists.playlists.items[0].id,
        limit
      );
      
      return playlistTracks.items
        .filter(item => item.track && item.track.type === 'track')
        .map(item => mapSpotifyTrack(item.track as SpotifyTrack));
    } catch (error) {
      console.error('Error fetching popular tracks:', error);
      return [];
    }
  }

  async getNewReleases(limit = 20): Promise<Track[]> {
    try {
      const newAlbums = await this.client.getNewReleases(Math.min(limit, 50));
      
      // Get tracks from first few albums
      const albumIds = newAlbums.albums.items.slice(0, 5).map(album => album.id);
      const trackPromises = albumIds.map(id => this.getTracksByAlbum(id));
      const albumTracks = await Promise.all(trackPromises);
      
      // Flatten and limit
      return albumTracks.flat().slice(0, limit);
    } catch (error) {
      console.error('Error fetching new releases:', error);
      return [];
    }
  }

  async getNewReleaseAlbums(limit = 20): Promise<Album[]> {
    try {
      const newAlbums = await this.client.getNewReleases(Math.min(limit, 50));
      return newAlbums.albums.items.map(mapSpotifyAlbum);
    } catch (error) {
      console.error('Error fetching new release albums:', error);
      return [];
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const results = await this.client.searchTracks(query, 50);
      return results.tracks.items.map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async searchArtists(query: string): Promise<Artist[]> {
    try {
      const results = await this.client.searchArtists(query, 50);
      return results.artists.items.map(mapSpotifyArtist);
    } catch (error) {
      console.error('Error searching artists:', error);
      return [];
    }
  }

  async searchAlbums(query: string): Promise<Album[]> {
    try {
      const results = await this.client.searchAlbums(query, 50);
      return results.albums.items.map(mapSpotifyAlbum);
    } catch (error) {
      console.error('Error searching albums:', error);
      return [];
    }
  }

  async getRecommendedTracks(seedTrackIds: string[], limit = 20): Promise<Track[]> {
    try {
      const recommendations = await this.client.getRecommendations({
        seed_tracks: seedTrackIds.slice(0, 5), // Spotify allows max 5 seeds
        limit
      });
      
      return recommendations.tracks.map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  async getTopArtists(limit = 20): Promise<Artist[]> {
    try {
      const topArtists = await this.client.getMyTopArtists(limit);
      return topArtists.items.map(mapSpotifyArtist);
    } catch (error) {
      console.error('Error fetching top artists:', error);
      return [];
    }
  }

  async getTopTracks(limit = 20): Promise<Track[]> {
    try {
      const topTracks = await this.client.getMyTopTracks(limit);
      return topTracks.items.map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      return [];
    }
  }
}

// Export singleton instance
export const spotifyDataService = new SpotifyDataService();