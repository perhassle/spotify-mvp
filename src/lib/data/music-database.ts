import type { Track, Artist, Album } from '@/types';
import mockDatabase from '@/data/mock-music-database.json';

class MusicDatabase {
  private tracks: Track[] = [];
  private artists: Artist[] = [];
  private albums: Album[] = [];

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    // Load artists
    this.artists = mockDatabase.artists.map(artist => ({
      ...artist,
      id: artist.id,
      name: artist.name,
      bio: artist.bio,
      imageUrl: artist.imageUrl,
      genres: artist.genres,
      followers: artist.followers,
      isVerified: artist.isVerified,
      popularity: artist.popularity,
    }));

    // Load albums
    this.albums = mockDatabase.albums.map(album => ({
      ...album,
      id: album.id,
      title: album.title,
      artist: this.artists.find(a => a.id === album.artist) || this.artists[0]!,
      releaseDate: new Date(album.releaseDate),
      totalTracks: album.totalTracks,
      imageUrl: album.imageUrl,
      genres: album.genres,
      type: album.type as "album" | "single" | "compilation",
    }));

    // Load tracks
    this.tracks = mockDatabase.tracks.map(track => ({
      ...track,
      id: track.id,
      title: track.title,
      artist: this.artists.find(a => a.id === track.artist) || this.artists[0]!,
      album: this.albums.find(a => a.id === track.album) || this.albums[0]!,
      duration: track.duration,
      previewUrl: track.previewUrl,
      streamUrl: track.streamUrl,
      isExplicit: track.isExplicit,
      popularity: track.popularity,
      trackNumber: track.trackNumber,
      genres: track.genres,
      releaseDate: new Date(track.releaseDate),
      imageUrl: track.imageUrl,
    }));
  }

  async getAllTracks(): Promise<Track[]> {
    return [...this.tracks];
  }

  async getTrack(id: string): Promise<Track | null> {
    return this.tracks.find(track => track.id === id) || null;
  }

  async getTracks(ids: string[]): Promise<Track[]> {
    return this.tracks.filter(track => ids.includes(track.id));
  }

  async getAllArtists(): Promise<Artist[]> {
    return [...this.artists];
  }

  async getArtist(id: string): Promise<Artist | null> {
    return this.artists.find(artist => artist.id === id) || null;
  }

  async getArtists(ids: string[]): Promise<Artist[]> {
    return this.artists.filter(artist => ids.includes(artist.id));
  }

  async getAllAlbums(): Promise<Album[]> {
    return [...this.albums];
  }

  async getAlbum(id: string): Promise<Album | null> {
    return this.albums.find(album => album.id === id) || null;
  }

  async getAlbums(ids: string[]): Promise<Album[]> {
    return this.albums.filter(album => ids.includes(album.id));
  }

  async getTracksByGenres(genres: string[]): Promise<Track[]> {
    return this.tracks.filter(track => 
      track.genres.some(genre => genres.includes(genre))
    );
  }

  async getTracksByArtist(artistId: string): Promise<Track[]> {
    return this.tracks.filter(track => track.artist.id === artistId);
  }

  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    return this.tracks.filter(track => track.album.id === albumId);
  }

  async getPopularTracks(limit = 50): Promise<Track[]> {
    return [...this.tracks]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  async getNewReleases(limit = 20): Promise<Track[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.tracks
      .filter(track => track.releaseDate > thirtyDaysAgo)
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime())
      .slice(0, limit);
  }

  async searchTracks(query: string): Promise<Track[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.tracks.filter(track => 
      track.title.toLowerCase().includes(lowercaseQuery) ||
      track.artist.name.toLowerCase().includes(lowercaseQuery) ||
      track.album.title.toLowerCase().includes(lowercaseQuery)
    );
  }

  async searchArtists(query: string): Promise<Artist[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.artists.filter(artist => 
      artist.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  async searchAlbums(query: string): Promise<Album[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.albums.filter(album => 
      album.title.toLowerCase().includes(lowercaseQuery) ||
      album.artist.name.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getRecommendedTracks(seedTrackIds: string[], limit = 20): Promise<Track[]> {
    // Simple implementation - get tracks from same genres/artists
    const seedTracks = await this.getTracks(seedTrackIds);
    if (seedTracks.length === 0) return [];

    const seedGenres = [...new Set(seedTracks.flatMap(track => track.genres))];
    const seedArtistIds = [...new Set(seedTracks.map(track => track.artist.id))];

    const candidates = this.tracks.filter(track => 
      !seedTrackIds.includes(track.id) && (
        track.genres.some(genre => seedGenres.includes(genre)) ||
        seedArtistIds.includes(track.artist.id)
      )
    );

    // Sort by relevance (genre overlap + popularity)
    const scored = candidates.map(track => ({
      track,
      score: this.calculateRelevanceScore(track, seedGenres, seedArtistIds)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.track);
  }

  private calculateRelevanceScore(track: Track, seedGenres: string[], seedArtistIds: string[]): number {
    let score = 0;

    // Genre match score
    const genreMatches = track.genres.filter(genre => seedGenres.includes(genre)).length;
    score += (genreMatches / Math.max(track.genres.length, 1)) * 0.6;

    // Artist match score
    if (seedArtistIds.includes(track.artist.id)) {
      score += 0.3;
    }

    // Popularity boost
    score += (track.popularity / 100) * 0.1;

    return score;
  }

  // Get tracks by audio features (mock implementation)
  async getTracksByFeatures(features: {
    danceability?: { min: number; max: number };
    energy?: { min: number; max: number };
    valence?: { min: number; max: number };
    tempo?: { min: number; max: number };
  }): Promise<Track[]> {
    // Mock implementation - in a real app, this would filter by actual audio features
    // For now, return a random selection based on mock criteria
    const filteredTracks = this.tracks.filter(track => {
      // Mock filtering logic based on track properties
      const mockDanceability = (track.popularity / 100) * Math.random();
      const mockEnergy = ((track.genres.includes('Electronic') || track.genres.includes('Hip Hop')) ? 0.8 : 0.5) * Math.random();
      const mockValence = (track.genres.includes('Pop') ? 0.7 : 0.4) * Math.random();
      const mockTempo = 80 + (track.popularity / 100) * 60; // 80-140 BPM range

      if (features.danceability && (mockDanceability < features.danceability.min || mockDanceability > features.danceability.max)) {
        return false;
      }
      if (features.energy && (mockEnergy < features.energy.min || mockEnergy > features.energy.max)) {
        return false;
      }
      if (features.valence && (mockValence < features.valence.min || mockValence > features.valence.max)) {
        return false;
      }
      if (features.tempo && (mockTempo < features.tempo.min || mockTempo > features.tempo.max)) {
        return false;
      }

      return true;
    });

    return filteredTracks.slice(0, 50); // Limit results
  }

  // Get similar tracks (mock implementation)
  async getSimilarTracks(trackId: string, limit = 10): Promise<Track[]> {
    const track = await this.getTrack(trackId);
    if (!track) return [];

    // Find tracks with similar genres and artists
    const similarTracks = this.tracks.filter(t => 
      t.id !== trackId && (
        t.artist.id === track.artist.id ||
        t.genres.some(genre => track.genres.includes(genre))
      )
    );

    // Sort by similarity score
    const scored = similarTracks.map(t => ({
      track: t,
      score: this.calculateSimilarityScore(track, t)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.track);
  }

  private calculateSimilarityScore(track1: Track, track2: Track): number {
    let score = 0;

    // Same artist gets high score
    if (track1.artist.id === track2.artist.id) {
      score += 0.5;
    }

    // Genre overlap
    const genreOverlap = track1.genres.filter(g => track2.genres.includes(g)).length;
    const totalGenres = new Set([...track1.genres, ...track2.genres]).size;
    score += (genreOverlap / totalGenres) * 0.3;

    // Popularity similarity
    const popularityDiff = Math.abs(track1.popularity - track2.popularity);
    score += (1 - popularityDiff / 100) * 0.2;

    return score;
  }

  async getTrackCount(): Promise<number> {
    return this.tracks.length;
  }

  async getArtistCount(): Promise<number> {
    return this.artists.length;
  }

  async getAlbumCount(): Promise<number> {
    return this.albums.length;
  }
}

export const musicDatabase = new MusicDatabase();