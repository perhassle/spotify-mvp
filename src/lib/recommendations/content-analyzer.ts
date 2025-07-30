import type {
  TrackFeatures,
  Track,
  Artist,
  ItemSimilarity,
  ContentMetadata,
} from '@/types';

export class ContentAnalyzer {
  private trackFeatures: Map<string, TrackFeatures> = new Map();
  private trackSimilarities: Map<string, ItemSimilarity> = new Map();
  private artistSimilarities: Map<string, ItemSimilarity> = new Map();
  private genreSimilarities: Map<string, ItemSimilarity> = new Map();

  constructor() {
    this.initializeMockData();
  }

  getTrackFeatures(trackId: string): TrackFeatures | null {
    return this.trackFeatures.get(trackId) || null;
  }

  calculateTrackSimilarity(trackId1: string, trackId2: string): number {
    const features1 = this.getTrackFeatures(trackId1);
    const features2 = this.getTrackFeatures(trackId2);

    if (!features1 || !features2) return 0;

    // Calculate cosine similarity based on audio features
    const audioFeatures = [
      'danceability', 'energy', 'valence', 'acousticness', 
      'instrumentalness', 'liveness', 'speechiness'
    ];

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    audioFeatures.forEach(feature => {
      const value1 = features1[feature as keyof TrackFeatures] as number;
      const value2 = features2[feature as keyof TrackFeatures] as number;
      
      dotProduct += value1 * value2;
      magnitude1 += value1 * value1;
      magnitude2 += value2 * value2;
    });

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    const audioSimilarity = magnitude > 0 ? dotProduct / magnitude : 0;

    // Consider genre overlap
    const genreOverlap = this.calculateGenreOverlap(features1.genres, features2.genres);
    
    // Consider tempo similarity
    const tempoSimilarity = this.calculateTempoSimilarity(features1.tempo, features2.tempo);

    // Consider mood tags overlap
    const moodSimilarity = this.calculateMoodTagsOverlap(features1.moodTags, features2.moodTags);

    // Weighted combination
    return (audioSimilarity * 0.5) + (genreOverlap * 0.25) + (tempoSimilarity * 0.15) + (moodSimilarity * 0.1);
  }

  calculateArtistSimilarity(artistId1: string, artistId2: string): number {
    const similarity = this.artistSimilarities.get(artistId1);
    if (similarity && similarity.similarities[artistId2]) {
      return similarity.similarities[artistId2];
    }

    // Calculate based on genre overlap and collaboration history
    // Mock implementation
    const hash1 = this.simpleHash(artistId1);
    const hash2 = this.simpleHash(artistId2);
    const similarity_score = Math.abs(hash1 - hash2) / Math.max(hash1, hash2, 1);
    
    return Math.max(0, 1 - similarity_score);
  }

  calculateGenreSimilarity(genre1: string, genre2: string): number {
    if (genre1 === genre2) return 1.0;

    const similarity = this.genreSimilarities.get(genre1);
    if (similarity && similarity.similarities[genre2]) {
      return similarity.similarities[genre2];
    }

    // Use predefined genre similarity matrix
    return this.getGenreSimilarityFromMatrix(genre1, genre2);
  }

  getSimilarTracks(trackId: string, limit = 10): string[] {
    const similarity = this.trackSimilarities.get(trackId);
    if (!similarity) return [];

    return Object.entries(similarity.similarities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  getSimilarArtists(artistId: string, limit = 10): string[] {
    const similarity = this.artistSimilarities.get(artistId);
    if (!similarity) return [];

    return Object.entries(similarity.similarities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  getSimilarGenres(genre: string, limit = 5): string[] {
    const similarity = this.genreSimilarities.get(genre);
    if (!similarity) return [];

    return Object.entries(similarity.similarities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genreName]) => genreName);
  }

  analyzePlaylistCoherence(trackIds: string[]): {
    coherenceScore: number;
    dominantGenres: string[];
    averageFeatures: Partial<TrackFeatures>;
    recommendations: string[];
  } {
    const features = trackIds
      .map(id => this.getTrackFeatures(id))
      .filter((f): f is TrackFeatures => f !== null);

    if (features.length === 0) {
      return {
        coherenceScore: 0,
        dominantGenres: [],
        averageFeatures: {},
        recommendations: [],
      };
    }

    // Calculate coherence score based on feature variance
    const coherenceScore = this.calculateCoherence(features);

    // Find dominant genres
    const genreCounts = new Map<string, number>();
    features.forEach(f => {
      f.genres.forEach(genre => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });

    const dominantGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Calculate average features
    const averageFeatures = this.calculateAverageFeatures(features);

    // Generate recommendations based on playlist characteristics
    const recommendations = this.generatePlaylistRecommendations(averageFeatures, dominantGenres);

    return {
      coherenceScore,
      dominantGenres,
      averageFeatures,
      recommendations: recommendations.slice(0, 10),
    };
  }

  extractMoodFromFeatures(features: TrackFeatures): string[] {
    const moods: string[] = [];

    // Valence-based moods
    if (features.valence > 0.7) {
      moods.push('happy', 'uplifting', 'positive');
    } else if (features.valence < 0.3) {
      moods.push('sad', 'melancholic', 'emotional');
    } else {
      moods.push('neutral', 'balanced');
    }

    // Energy-based moods
    if (features.energy > 0.8) {
      moods.push('energetic', 'intense', 'powerful');
    } else if (features.energy < 0.3) {
      moods.push('calm', 'peaceful', 'relaxing');
    }

    // Danceability-based moods
    if (features.danceability > 0.7) {
      moods.push('danceable', 'groovy', 'rhythmic');
    }

    // Acousticness-based moods
    if (features.acousticness > 0.7) {
      moods.push('acoustic', 'organic', 'intimate');
    }

    // Instrumentalness-based moods
    if (features.instrumentalness > 0.5) {
      moods.push('instrumental', 'atmospheric');
    }

    return [...new Set(moods)]; // Remove duplicates
  }

  private calculateGenreOverlap(genres1: string[], genres2: string[]): number {
    const set1 = new Set(genres1);
    const set2 = new Set(genres2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateTempoSimilarity(tempo1: number, tempo2: number): number {
    const diff = Math.abs(tempo1 - tempo2);
    const maxDiff = 100; // Assume max meaningful tempo difference is 100 BPM
    return Math.max(0, 1 - (diff / maxDiff));
  }

  private calculateMoodTagsOverlap(moods1: string[], moods2: string[]): number {
    if (moods1.length === 0 || moods2.length === 0) return 0;
    
    const set1 = new Set(moods1);
    const set2 = new Set(moods2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  private getGenreSimilarityFromMatrix(genre1: string, genre2: string): number {
    // Predefined genre similarity matrix
    const genreMatrix: Record<string, Record<string, number>> = {
      'Pop': { 'Dance Pop': 0.8, 'Electropop': 0.7, 'Indie Pop': 0.6, 'Rock': 0.4 },
      'Rock': { 'Alternative Rock': 0.9, 'Indie Rock': 0.8, 'Pop Rock': 0.7, 'Pop': 0.4 },
      'Hip Hop': { 'Rap': 0.9, 'Trap': 0.8, 'R&B': 0.6, 'Pop': 0.3 },
      'Electronic': { 'Dance': 0.8, 'Techno': 0.7, 'House': 0.7, 'Ambient': 0.4 },
      'Jazz': { 'Blues': 0.7, 'Soul': 0.6, 'Classical': 0.4, 'R&B': 0.5 },
      'Classical': { 'Ambient': 0.5, 'Instrumental': 0.6, 'Jazz': 0.4 },
      'Country': { 'Folk': 0.7, 'Americana': 0.8, 'Rock': 0.4 },
      'R&B': { 'Soul': 0.8, 'Hip Hop': 0.6, 'Pop': 0.5, 'Jazz': 0.5 },
    };

    return genreMatrix[genre1]?.[genre2] || genreMatrix[genre2]?.[genre1] || 0.1;
  }

  private calculateCoherence(features: TrackFeatures[]): number {
    if (features.length < 2) return 1;

    const audioFeatures = ['danceability', 'energy', 'valence', 'acousticness'];
    let totalVariance = 0;

    audioFeatures.forEach(feature => {
      const values = features.map(f => f[feature as keyof TrackFeatures] as number);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    });

    const averageVariance = totalVariance / audioFeatures.length;
    return Math.max(0, 1 - (averageVariance * 2)); // Normalize to 0-1 range
  }

  private calculateAverageFeatures(features: TrackFeatures[]): Partial<TrackFeatures> {
    if (features.length === 0) return {};

    const averages: any = {};
    const numericFeatures = [
      'danceability', 'energy', 'valence', 'acousticness', 
      'instrumentalness', 'liveness', 'speechiness', 'tempo', 'loudness'
    ];

    numericFeatures.forEach(feature => {
      const values = features.map(f => f[feature as keyof TrackFeatures] as number);
      averages[feature] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return averages;
  }

  private generatePlaylistRecommendations(
    averageFeatures: Partial<TrackFeatures>,
    dominantGenres: string[]
  ): string[] {
    // Mock implementation - in a real app, this would query the music database
    // for tracks matching the playlist characteristics
    const mockRecommendations: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      mockRecommendations.push(`track-recommendation-${i}`);
    }

    return mockRecommendations;
  }

  private initializeMockData(): void {
    // Initialize mock track features for demonstration
    for (let i = 1; i <= 100; i++) {
      const trackId = `track-${i}`;
      const features: TrackFeatures = {
        trackId,
        danceability: Math.random(),
        energy: Math.random(),
        valence: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random(),
        tempo: 60 + Math.random() * 140,
        loudness: -30 + Math.random() * 30,
        mode: Math.random() > 0.5 ? 1 : 0,
        key: Math.floor(Math.random() * 12),
        timeSignature: 4,
        duration: 180 + Math.random() * 120,
        genres: this.generateMockGenres(),
        moodTags: this.generateMockMoodTags(),
        contextTags: this.generateMockContextTags(),
      };

      this.trackFeatures.set(trackId, features);
    }

    // Initialize mock similarity data
    this.initializeMockSimilarities();
  }

  private generateMockGenres(): string[] {
    const allGenres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 'R&B', 'Indie', 'Folk'];
    const count = 1 + Math.floor(Math.random() * 3);
    const genres: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const genre = allGenres[Math.floor(Math.random() * allGenres.length)];
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    }
    
    return genres;
  }

  private generateMockMoodTags(): string[] {
    const allMoods = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'aggressive', 'melancholic', 'uplifting'];
    const count = 1 + Math.floor(Math.random() * 3);
    const moods: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const mood = allMoods[Math.floor(Math.random() * allMoods.length)];
      if (mood && !moods.includes(mood)) {
        moods.push(mood);
      }
    }
    
    return moods;
  }

  private generateMockContextTags(): string[] {
    const allContexts = ['workout', 'study', 'party', 'chill', 'commute', 'sleep', 'focus', 'background'];
    const count = Math.floor(Math.random() * 3);
    const contexts: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const context = allContexts[Math.floor(Math.random() * allContexts.length)];
      if (context && !contexts.includes(context)) {
        contexts.push(context);
      }
    }
    
    return contexts;
  }

  private initializeMockSimilarities(): void {
    // Generate track similarities
    for (let i = 1; i <= 100; i++) {
      const trackId = `track-${i}`;
      const similarities: Record<string, number> = {};
      
      for (let j = 1; j <= 100; j++) {
        if (i !== j) {
          const otherTrackId = `track-${j}`;
          similarities[otherTrackId] = Math.random();
        }
      }
      
      this.trackSimilarities.set(trackId, {
        itemId: trackId,
        itemType: 'track',
        similarities,
        lastUpdated: new Date(),
      });
    }

    // Generate artist similarities
    for (let i = 1; i <= 50; i++) {
      const artistId = `artist-${i}`;
      const similarities: Record<string, number> = {};
      
      for (let j = 1; j <= 50; j++) {
        if (i !== j) {
          const otherArtistId = `artist-${j}`;
          similarities[otherArtistId] = Math.random();
        }
      }
      
      this.artistSimilarities.set(artistId, {
        itemId: artistId,
        itemType: 'artist',
        similarities,
        lastUpdated: new Date(),
      });
    }

    // Generate genre similarities
    const genres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 'R&B', 'Indie', 'Folk'];
    genres.forEach(genre => {
      const similarities: Record<string, number> = {};
      
      genres.forEach(otherGenre => {
        if (genre !== otherGenre) {
          similarities[otherGenre] = this.getGenreSimilarityFromMatrix(genre, otherGenre);
        }
      });
      
      this.genreSimilarities.set(genre, {
        itemId: genre,
        itemType: 'genre',
        similarities,
        lastUpdated: new Date(),
      });
    });
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}