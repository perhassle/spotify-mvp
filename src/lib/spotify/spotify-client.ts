import { cookies } from 'next/headers';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum } from './spotify-types';

export class SpotifyClient {
  private baseUrl = 'https://api.spotify.com/v1';
  
  private async getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('spotify_access_token')?.value || null;
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/spotify/refresh`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
    return null;
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const makeRequest = async (token: string) => {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          // Retry with new token
          return fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });
        }
      }

      return response;
    };

    const response = await makeRequest(accessToken);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Spotify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // User endpoints
  async getCurrentUser(): Promise<any> {
    return this.request<any>('/me');
  }

  async getUserPlaylists(limit = 20, offset = 0): Promise<any> {
    return this.request<any>(`/me/playlists?limit=${limit}&offset=${offset}`);
  }

  // Search endpoints
  async search(query: string, types: string[] = ['track', 'artist', 'album'], limit = 20): Promise<any> {
    const type = types.join(',');
    const q = encodeURIComponent(query);
    return this.request<any>(`/search?q=${q}&type=${type}&limit=${limit}`);
  }

  // Track endpoints
  async getTrack(id: string): Promise<SpotifyTrack> {
    return this.request<SpotifyTrack>(`/tracks/${id}`);
  }

  async getTracks(ids: string[]): Promise<{ tracks: SpotifyTrack[] }> {
    return this.request<{ tracks: SpotifyTrack[] }>(`/tracks?ids=${ids.join(',')}`);
  }

  // Album endpoints
  async getAlbum(id: string): Promise<SpotifyAlbum> {
    return this.request<SpotifyAlbum>(`/albums/${id}`);
  }

  async getAlbums(ids: string[]): Promise<{ albums: SpotifyAlbum[] }> {
    return this.request<{ albums: SpotifyAlbum[] }>(`/albums?ids=${ids.join(',')}`);
  }

  async getAlbumTracks(id: string, limit = 50): Promise<{ items: Array<{ id: string; [key: string]: any }> }> {
    return this.request<{ items: Array<{ id: string; [key: string]: any }> }>(`/albums/${id}/tracks?limit=${limit}`);
  }

  // Artist endpoints
  async getArtist(id: string): Promise<SpotifyArtist> {
    return this.request<SpotifyArtist>(`/artists/${id}`);
  }

  async getArtists(ids: string[]): Promise<{ artists: SpotifyArtist[] }> {
    return this.request<{ artists: SpotifyArtist[] }>(`/artists?ids=${ids.join(',')}`);
  }

  async getArtistTopTracks(id: string, market = 'US'): Promise<{ tracks: SpotifyTrack[] }> {
    return this.request<{ tracks: SpotifyTrack[] }>(`/artists/${id}/top-tracks?market=${market}`);
  }

  async getArtistAlbums(id: string, limit = 20): Promise<any> {
    return this.request<any>(`/artists/${id}/albums?limit=${limit}`);
  }

  async getRelatedArtists(id: string): Promise<any> {
    return this.request<any>(`/artists/${id}/related-artists`);
  }

  // Playlist endpoints
  async getPlaylist(id: string): Promise<any> {
    return this.request<any>(`/playlists/${id}`);
  }

  async getPlaylistTracks(id: string, limit = 100, offset = 0): Promise<{ items: Array<{ track: SpotifyTrack | null }> }> {
    return this.request<{ items: Array<{ track: SpotifyTrack | null }> }>(`/playlists/${id}/tracks?limit=${limit}&offset=${offset}`);
  }

  // Player endpoints
  async getCurrentPlayback(): Promise<any> {
    return this.request<any>('/me/player');
  }

  async play(context_uri?: string, uris?: string[], position_ms?: number): Promise<any> {
    return this.request<any>('/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({
        ...(context_uri && { context_uri }),
        ...(uris && { uris }),
        ...(position_ms && { position_ms }),
      }),
    });
  }

  async pause(): Promise<any> {
    return this.request<any>('/me/player/pause', { method: 'PUT' });
  }

  async next(): Promise<any> {
    return this.request<any>('/me/player/next', { method: 'POST' });
  }

  async previous(): Promise<any> {
    return this.request<any>('/me/player/previous', { method: 'POST' });
  }

  async seek(position_ms: number): Promise<any> {
    return this.request<any>(`/me/player/seek?position_ms=${position_ms}`, { method: 'PUT' });
  }

  async setVolume(volume_percent: number): Promise<any> {
    return this.request<any>(`/me/player/volume?volume_percent=${volume_percent}`, { method: 'PUT' });
  }

  // Recommendations
  async getRecommendations(params: {
    seed_artists?: string[];
    seed_tracks?: string[];
    seed_genres?: string[];
    limit?: number;
  }): Promise<{ tracks: SpotifyTrack[] }> {
    const queryParams = new URLSearchParams();
    
    if (params.seed_artists?.length) {
      queryParams.append('seed_artists', params.seed_artists.join(','));
    }
    if (params.seed_tracks?.length) {
      queryParams.append('seed_tracks', params.seed_tracks.join(','));
    }
    if (params.seed_genres?.length) {
      queryParams.append('seed_genres', params.seed_genres.join(','));
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    return this.request<{ tracks: SpotifyTrack[] }>(`/recommendations?${queryParams.toString()}`);
  }

  // Browse endpoints
  async getFeaturedPlaylists(limit = 20): Promise<{ playlists: { items: Array<{ id: string; [key: string]: any }> } }> {
    return this.request<{ playlists: { items: Array<{ id: string; [key: string]: any }> } }>(`/browse/featured-playlists?limit=${limit}`);
  }

  async getNewReleases(limit = 20): Promise<{ albums: { items: SpotifyAlbum[] } }> {
    return this.request<{ albums: { items: SpotifyAlbum[] } }>(`/browse/new-releases?limit=${limit}`);
  }

  // Search endpoints
  async searchTracks(query: string, limit = 20): Promise<{ tracks: { items: SpotifyTrack[] } }> {
    return this.request<{ tracks: { items: SpotifyTrack[] } }>(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
  }

  async searchArtists(query: string, limit = 20): Promise<{ artists: { items: SpotifyArtist[] } }> {
    return this.request<{ artists: { items: SpotifyArtist[] } }>(`/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`);
  }

  async searchAlbums(query: string, limit = 20): Promise<{ albums: { items: SpotifyAlbum[] } }> {
    return this.request<{ albums: { items: SpotifyAlbum[] } }>(`/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`);
  }

  // User's top items
  async getMyTopTracks(limit = 20): Promise<{ items: SpotifyTrack[] }> {
    return this.request<{ items: SpotifyTrack[] }>(`/me/top/tracks?limit=${limit}`);
  }

  async getMyTopArtists(limit = 20): Promise<{ items: SpotifyArtist[] }> {
    return this.request<{ items: SpotifyArtist[] }>(`/me/top/artists?limit=${limit}`);
  }

  async getCategories(limit = 20): Promise<any> {
    return this.request<any>(`/browse/categories?limit=${limit}`);
  }
}

// Export singleton instance
export const spotifyClient = new SpotifyClient();