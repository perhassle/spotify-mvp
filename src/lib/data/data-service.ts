import type { Track, Artist, Album } from '@/types';
import { musicDatabase } from './music-database';
import { spotifyDataService } from './spotify-data-service';
import { cookies } from 'next/headers';

/**
 * Data service that automatically switches between mock data and Spotify API
 * based on whether the user has connected their Spotify account
 */
class DataService {
  private async isSpotifyConnected(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      // Client-side check
      return document.cookie.includes('spotify_access_token');
    }
    
    // Server-side check
    try {
      const cookieStore = await cookies();
      return !!cookieStore.get('spotify_access_token');
    } catch {
      return false;
    }
  }

  private async getService() {
    const connected = await this.isSpotifyConnected();
    return connected ? spotifyDataService : musicDatabase;
  }

  async getAllTracks(): Promise<Track[]> {
    const service = await this.getService();
    return service.getAllTracks();
  }

  async getTrack(id: string): Promise<Track | null> {
    const service = await this.getService();
    return service.getTrack(id);
  }

  async getTracks(ids: string[]): Promise<Track[]> {
    const service = await this.getService();
    return service.getTracks(ids);
  }

  async getAllArtists(): Promise<Artist[]> {
    const service = await this.getService();
    return service.getAllArtists();
  }

  async getArtist(id: string): Promise<Artist | null> {
    const service = await this.getService();
    return service.getArtist(id);
  }

  async getArtists(ids: string[]): Promise<Artist[]> {
    const service = await this.getService();
    return service.getArtists(ids);
  }

  async getAllAlbums(): Promise<Album[]> {
    const service = await this.getService();
    return service.getAllAlbums();
  }

  async getAlbum(id: string): Promise<Album | null> {
    const service = await this.getService();
    return service.getAlbum(id);
  }

  async getAlbums(ids: string[]): Promise<Album[]> {
    const service = await this.getService();
    return service.getAlbums(ids);
  }

  async getTracksByGenres(genres: string[]): Promise<Track[]> {
    const service = await this.getService();
    return service.getTracksByGenres(genres);
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    const service = await this.getService();
    return service.getTracksByArtist(artistId);
  }

  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    const service = await this.getService();
    return service.getTracksByAlbum(albumId);
  }

  async getPopularTracks(limit = 50): Promise<Track[]> {
    const service = await this.getService();
    return service.getPopularTracks(limit);
  }

  async getNewReleases(limit = 20): Promise<Track[]> {
    const service = await this.getService();
    return service.getNewReleases(limit);
  }

  async searchTracks(query: string): Promise<Track[]> {
    const service = await this.getService();
    return service.searchTracks(query);
  }

  async searchArtists(query: string): Promise<Artist[]> {
    const service = await this.getService();
    return service.searchArtists(query);
  }

  async searchAlbums(query: string): Promise<Album[]> {
    const service = await this.getService();
    return service.searchAlbums(query);
  }

  async getRecommendedTracks(seedTrackIds: string[], limit = 20): Promise<Track[]> {
    const service = await this.getService();
    return service.getRecommendedTracks(seedTrackIds, limit);
  }

  // Additional methods for Spotify-specific features
  async getTopArtists(limit = 20): Promise<Artist[]> {
    const connected = await this.isSpotifyConnected();
    if (connected) {
      return spotifyDataService.getTopArtists(limit);
    }
    // Fallback to popular artists from mock data
    const artists = await musicDatabase.getAllArtists();
    return artists
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  async getTopTracks(limit = 20): Promise<Track[]> {
    const connected = await this.isSpotifyConnected();
    if (connected) {
      return spotifyDataService.getTopTracks(limit);
    }
    // Fallback to popular tracks
    return musicDatabase.getPopularTracks(limit);
  }

  // Album-specific method
  async getAlbumWithTracks(albumId: string): Promise<AlbumDetails> {
    const album = await this.getAlbum(albumId);
    if (!album) {
      throw new Error('Album not found');
    }

    const tracks = await this.getTracksByAlbum(albumId);
    const totalDuration = tracks.reduce((total, track) => total + track.duration, 0);
    const averagePopularity = tracks.length > 0 
      ? tracks.reduce((sum, track) => sum + track.popularity, 0) / tracks.length
      : 0;

    return {
      ...album,
      tracks,
      totalDuration,
      averagePopularity,
    };
  }
}

// Export types from album-service
export interface AlbumDetails extends Album {
  tracks: Track[];
  totalDuration: number;
  averagePopularity: number;
}

// Export singleton instance
export const dataService = new DataService();