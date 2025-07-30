import { cookies } from 'next/headers';

export class SpotifyClient {
  private baseUrl = 'https://api.spotify.com/v1';
  
  private async getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('spotify_access_token')?.value || null;
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/spotify/refresh', {
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
    let accessToken = await this.getAccessToken();
    
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
  async getCurrentUser() {
    return this.request('/me');
  }

  async getUserPlaylists(limit = 20, offset = 0) {
    return this.request(`/me/playlists?limit=${limit}&offset=${offset}`);
  }

  // Search endpoints
  async search(query: string, types: string[] = ['track', 'artist', 'album'], limit = 20) {
    const type = types.join(',');
    const q = encodeURIComponent(query);
    return this.request(`/search?q=${q}&type=${type}&limit=${limit}`);
  }

  // Track endpoints
  async getTrack(id: string) {
    return this.request(`/tracks/${id}`);
  }

  async getTracks(ids: string[]) {
    return this.request(`/tracks?ids=${ids.join(',')}`);
  }

  // Album endpoints
  async getAlbum(id: string) {
    return this.request(`/albums/${id}`);
  }

  async getAlbumTracks(id: string, limit = 50) {
    return this.request(`/albums/${id}/tracks?limit=${limit}`);
  }

  // Artist endpoints
  async getArtist(id: string) {
    return this.request(`/artists/${id}`);
  }

  async getArtistTopTracks(id: string, market = 'US') {
    return this.request(`/artists/${id}/top-tracks?market=${market}`);
  }

  async getArtistAlbums(id: string, limit = 20) {
    return this.request(`/artists/${id}/albums?limit=${limit}`);
  }

  async getRelatedArtists(id: string) {
    return this.request(`/artists/${id}/related-artists`);
  }

  // Playlist endpoints
  async getPlaylist(id: string) {
    return this.request(`/playlists/${id}`);
  }

  async getPlaylistTracks(id: string, limit = 100, offset = 0) {
    return this.request(`/playlists/${id}/tracks?limit=${limit}&offset=${offset}`);
  }

  // Player endpoints
  async getCurrentPlayback() {
    return this.request('/me/player');
  }

  async play(context_uri?: string, uris?: string[], position_ms?: number) {
    return this.request('/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({
        ...(context_uri && { context_uri }),
        ...(uris && { uris }),
        ...(position_ms && { position_ms }),
      }),
    });
  }

  async pause() {
    return this.request('/me/player/pause', { method: 'PUT' });
  }

  async next() {
    return this.request('/me/player/next', { method: 'POST' });
  }

  async previous() {
    return this.request('/me/player/previous', { method: 'POST' });
  }

  async seek(position_ms: number) {
    return this.request(`/me/player/seek?position_ms=${position_ms}`, { method: 'PUT' });
  }

  async setVolume(volume_percent: number) {
    return this.request(`/me/player/volume?volume_percent=${volume_percent}`, { method: 'PUT' });
  }

  // Recommendations
  async getRecommendations(params: {
    seed_artists?: string[];
    seed_tracks?: string[];
    seed_genres?: string[];
    limit?: number;
  }) {
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

    return this.request(`/recommendations?${queryParams.toString()}`);
  }

  // Browse endpoints
  async getFeaturedPlaylists(limit = 20) {
    return this.request(`/browse/featured-playlists?limit=${limit}`);
  }

  async getNewReleases(limit = 20) {
    return this.request(`/browse/new-releases?limit=${limit}`);
  }

  async getCategories(limit = 20) {
    return this.request(`/browse/categories?limit=${limit}`);
  }
}

// Export singleton instance
export const spotifyClient = new SpotifyClient();