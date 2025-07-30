import type {
  RecommendationRequest,
  RecommendationScore,
  UserProfile,
  RecommendationContext,
  TrackFeatures,
  GenrePreference,
  ArtistPreference,
} from '@/types';
import { ContentAnalyzer } from './content-analyzer';

export class ContentBasedFilter {
  private contentAnalyzer: ContentAnalyzer;

  constructor() {
    this.contentAnalyzer = new ContentAnalyzer();
  }

  async recommend(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const _recommendations: RecommendationScore[] = [];

    // Get recommendations based on different content aspects
    const genreBasedRecs = await this.getGenreBasedRecommendations(request, userProfile, context);
    const artistBasedRecs = await this.getArtistBasedRecommendations(request, userProfile, context);
    const audioFeatureRecs = await this.getAudioFeatureRecommendations(request, userProfile, context);

    // Combine recommendations with different weights
    const combinedRecs = new Map<string, RecommendationScore>();

    // Genre-based (40% weight)
    genreBasedRecs.forEach(rec => {
      combinedRecs.set(rec.trackId, {
        ...rec,
        score: rec.score * 0.4,
      });
    });

    // Artist-based (35% weight)
    artistBasedRecs.forEach(rec => {
      const existing = combinedRecs.get(rec.trackId);
      if (existing) {
        existing.score += rec.score * 0.35;
        existing.reasons.push(...rec.reasons);
      } else {
        combinedRecs.set(rec.trackId, {
          ...rec,
          score: rec.score * 0.35,
        });
      }
    });

    // Audio feature-based (25% weight)
    audioFeatureRecs.forEach(rec => {
      const existing = combinedRecs.get(rec.trackId);
      if (existing) {
        existing.score += rec.score * 0.25;
        existing.reasons.push(...rec.reasons);
      } else {
        combinedRecs.set(rec.trackId, {
          ...rec,
          score: rec.score * 0.25,
        });
      }
    });

    return Array.from(combinedRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit);
  }

  private async getGenreBasedRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = [];
    const topGenres = userProfile.favoriteGenres
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // For each preferred genre, find similar genres and tracks
    for (const genrePref of topGenres) {
      const similarGenres = this.contentAnalyzer.getSimilarGenres(genrePref.genre, 3);
      const allGenres = [genrePref.genre, ...similarGenres];

      // Mock: get tracks from these genres
      const genreTracks = await this.getTracksByGenres(allGenres);
      
      genreTracks.forEach(trackId => {
        if (request.excludeTrackIds?.includes(trackId)) return;

        const score = this.calculateGenreScore(trackId, genrePref, context);
        const similarity = this.calculateGenreSimilarity(trackId, genrePref.genre);

        recommendations.push({
          trackId,
          score,
          reasons: [{
            type: 'similar_genre',
            weight: similarity,
            explanation: `You often listen to ${genrePref.genre}`,
            metadata: { genre: genrePref.genre, playCount: genrePref.playCount },
          }],
          algorithm: 'content_based',
          context,
          freshness: this.calculateFreshness(trackId),
          diversity: this.calculateGenreDiversity(trackId, userProfile),
        });
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(request.limit * 1.5)); // Get extra for final filtering
  }

  private async getArtistBasedRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = [];
    const topArtists = userProfile.favoriteArtists
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    for (const artistPref of topArtists) {
      // Get similar artists
      const similarArtists = this.contentAnalyzer.getSimilarArtists(artistPref.artistId, 5);
      const allArtists = [artistPref.artistId, ...similarArtists];

      // Get tracks from these artists
      for (const artistId of allArtists) {
        const artistTracks = await this.getTracksByArtist(artistId);
        
        artistTracks.forEach(trackId => {
          if (request.excludeTrackIds?.includes(trackId)) return;

          const score = this.calculateArtistScore(trackId, artistPref, artistId, context);
          const similarity = this.contentAnalyzer.calculateArtistSimilarity(artistPref.artistId, artistId);

          recommendations.push({
            trackId,
            score,
            reasons: [{
              type: 'similar_artist',
              weight: similarity,
              explanation: artistId === artistPref.artistId 
                ? `You've played ${artistPref.playCount} songs by this artist`
                : `Similar to artists you like`,
              metadata: { artistId, playCount: artistPref.playCount },
            }],
            algorithm: 'content_based',
            context,
            freshness: this.calculateFreshness(trackId),
            diversity: this.calculateArtistDiversity(trackId, userProfile),
          });
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(request.limit * 1.5));
  }

  private async getAudioFeatureRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = [];
    const userAudioPrefs = userProfile.audioFeaturePreferences;

    // Get all available tracks and score them based on audio feature similarity
    const allTracks = await this.getAllAvailableTracks();

    for (const trackId of allTracks) {
      if (request.excludeTrackIds?.includes(trackId)) continue;

      const trackFeatures = this.contentAnalyzer.getTrackFeatures(trackId);
      if (!trackFeatures) continue;

      const score = this.calculateAudioFeatureScore(trackFeatures, userAudioPrefs as unknown as Record<string, number>, context);
      const similarity = this.calculateFeatureSimilarity(trackFeatures, userAudioPrefs as unknown as Record<string, number>);

      if (score > 0.3) { // Only include tracks with reasonable similarity
        recommendations.push({
          trackId,
          score,
          reasons: [{
            type: 'audio_features',
            weight: similarity,
            explanation: 'Matches your audio preferences',
            metadata: { 
              matchingFeatures: this.getMatchingFeatures(trackFeatures, userAudioPrefs) 
            },
          }],
          algorithm: 'content_based',
          context,
          freshness: this.calculateFreshness(trackId),
          diversity: this.calculateFeatureDiversity(trackFeatures, userProfile),
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(request.limit * 1.5));
  }

  private calculateGenreScore(
    trackId: string,
    genrePref: GenrePreference,
    context: RecommendationContext
  ): number {
    let score = genrePref.score;

    // Boost based on recent activity
    const daysSinceActivity = (Date.now() - genrePref.recentActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity < 7) {
      score *= 1.2; // Recent activity boost
    }

    // Time-based adjustments
    if (context.timeOfDay === 'morning' && ['Pop', 'Indie', 'Electronic'].includes(genrePref.genre)) {
      score *= 1.1;
    } else if (context.timeOfDay === 'evening' && ['Jazz', 'Classical', 'Ambient'].includes(genrePref.genre)) {
      score *= 1.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateArtistScore(
    trackId: string,
    artistPref: ArtistPreference,
    currentArtistId: string,
    _context: RecommendationContext
  ): number {
    let score = artistPref.score;

    // Boost for exact artist match
    if (currentArtistId === artistPref.artistId) {
      score *= 1.3;
    }

    // Boost for followed artists
    if (artistPref.followStatus) {
      score *= 1.2;
    }

    // Boost for recently played artists
    const daysSinceLastPlayed = (Date.now() - artistPref.lastPlayed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPlayed < 3) {
      score *= 1.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateAudioFeatureScore(
    trackFeatures: TrackFeatures,
    userAudioPrefs: Record<string, number>,
    context: RecommendationContext
  ): number {
    const features = ['danceability', 'energy', 'valence', 'acousticness'];
    let totalSimilarity = 0;

    features.forEach(feature => {
      const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
      const userPref = userAudioPrefs[feature];
      if (userPref === undefined) return;
      const similarity = 1 - Math.abs(trackValue - userPref);
      totalSimilarity += similarity;
    });

    let score = totalSimilarity / features.length;

    // Context-based adjustments
    if (context.mood) {
      score *= this.getMoodAdjustment(trackFeatures, context.mood);
    }

    if (context.activity) {
      score *= this.getActivityAdjustment(trackFeatures, context.activity);
    }

    return Math.min(score, 1.0);
  }

  private calculateGenreSimilarity(trackId: string, preferredGenre: string): number {
    const trackFeatures = this.contentAnalyzer.getTrackFeatures(trackId);
    if (!trackFeatures) return 0;

    const trackGenres = trackFeatures.genres;
    if (trackGenres.includes(preferredGenre)) return 1.0;

    // Calculate similarity to preferred genre
    let maxSimilarity = 0;
    trackGenres.forEach(genre => {
      const similarity = this.contentAnalyzer.calculateGenreSimilarity(genre, preferredGenre);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return maxSimilarity;
  }

  private calculateFeatureSimilarity(trackFeatures: TrackFeatures, userAudioPrefs: any): number {
    const features = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness'];
    let totalSimilarity = 0;

    features.forEach(feature => {
      const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
      const userPref = userAudioPrefs[feature] || 0.5;
      const similarity = 1 - Math.abs(trackValue - userPref);
      totalSimilarity += similarity;
    });

    return totalSimilarity / features.length;
  }

  private getMatchingFeatures(trackFeatures: TrackFeatures, userAudioPrefs: any): string[] {
    const features = ['danceability', 'energy', 'valence', 'acousticness'];
    const matchingFeatures: string[] = [];

    features.forEach(feature => {
      const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
      const userPref = userAudioPrefs[feature];
      const similarity = 1 - Math.abs(trackValue - userPref);
      
      if (similarity > 0.8) {
        matchingFeatures.push(feature);
      }
    });

    return matchingFeatures;
  }

  private getMoodAdjustment(trackFeatures: TrackFeatures, mood: string): number {
    const moodMap: Record<string, Record<string, number>> = {
      'happy': { valence: 0.7, energy: 0.6, danceability: 0.6 },
      'sad': { valence: 0.3, energy: 0.4, acousticness: 0.6 },
      'energetic': { energy: 0.8, danceability: 0.7, valence: 0.6 },
      'calm': { energy: 0.3, valence: 0.5, acousticness: 0.7 },
      'focused': { instrumentalness: 0.6, energy: 0.4, valence: 0.5 },
      'nostalgic': { valence: 0.4, acousticness: 0.5, energy: 0.4 },
    };

    const moodPrefs = moodMap[mood];
    if (!moodPrefs) return 1.0;

    let adjustment = 0;
    let count = 0;

    Object.entries(moodPrefs).forEach(([feature, targetValue]) => {
      const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
      const similarity = 1 - Math.abs(trackValue - targetValue);
      adjustment += similarity;
      count++;
    });

    return count > 0 ? 0.8 + (adjustment / count) * 0.4 : 1.0; // Range: 0.8 - 1.2
  }

  private getActivityAdjustment(trackFeatures: TrackFeatures, activity: string): number {
    const activityMap: Record<string, Record<string, number>> = {
      'workout': { energy: 0.8, danceability: 0.7, tempo: 120 },
      'study': { instrumentalness: 0.7, energy: 0.3, valence: 0.5 },
      'commute': { energy: 0.6, valence: 0.6, danceability: 0.5 },
      'relaxing': { energy: 0.3, valence: 0.6, acousticness: 0.7 },
      'party': { energy: 0.8, danceability: 0.8, valence: 0.7 },
      'work': { instrumentalness: 0.5, energy: 0.5, valence: 0.5 },
    };

    const activityPrefs = activityMap[activity];
    if (!activityPrefs) return 1.0;

    let adjustment = 0;
    let count = 0;

    Object.entries(activityPrefs).forEach(([feature, targetValue]) => {
      if (feature === 'tempo') {
        const similarity = 1 - Math.abs(trackFeatures.tempo - targetValue) / 100;
        adjustment += Math.max(0, similarity);
      } else {
        const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
        const similarity = 1 - Math.abs(trackValue - targetValue);
        adjustment += similarity;
      }
      count++;
    });

    return count > 0 ? 0.8 + (adjustment / count) * 0.4 : 1.0;
  }

  private calculateFreshness(trackId: string): number {
    // Mock implementation - in real app, would check release date
    const hash = this.simpleHash(trackId);
    return (hash % 100) / 100;
  }

  private calculateGenreDiversity(trackId: string, userProfile: UserProfile): number {
    const trackFeatures = this.contentAnalyzer.getTrackFeatures(trackId);
    if (!trackFeatures) return 0.5;

    const userGenres = userProfile.favoriteGenres.map(g => g.genre);
    const trackGenres = trackFeatures.genres;
    
    const overlap = trackGenres.filter(g => userGenres.includes(g)).length;
    return 1 - (overlap / Math.max(trackGenres.length, 1));
  }

  private calculateArtistDiversity(trackId: string, userProfile: UserProfile): number {
    const artistId = this.getTrackArtistId(trackId);
    const userArtists = userProfile.favoriteArtists.map(a => a.artistId);
    
    return userArtists.includes(artistId) ? 0.2 : 0.8;
  }

  private calculateFeatureDiversity(trackFeatures: TrackFeatures, userProfile: UserProfile): number {
    const userPrefs = userProfile.audioFeaturePreferences;
    const features = ['danceability', 'energy', 'valence', 'acousticness'];
    
    let totalDifference = 0;
    features.forEach(feature => {
      const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
      const userPref = userPrefs[feature as keyof typeof userPrefs] as number;
      totalDifference += Math.abs(trackValue - userPref);
    });

    return totalDifference / features.length;
  }

  async trainModel(): Promise<void> {
    // Initialize content analyzer
    console.log('Content-based filter model training completed');
  }

  // Mock data methods
  private async getTracksByGenres(_genres: string[]): Promise<string[]> {
    // Mock implementation
    const tracks: string[] = [];
    for (let i = 1; i <= 50; i++) {
      tracks.push(`track-${i}`);
    }
    return tracks;
  }

  private async getTracksByArtist(artistId: string): Promise<string[]> {
    // Mock implementation
    const tracks: string[] = [];
    const hash = this.simpleHash(artistId);
    const trackCount = 5 + (hash % 10); // 5-15 tracks per artist
    
    for (let i = 0; i < trackCount; i++) {
      tracks.push(`track-${hash + i}`);
    }
    return tracks;
  }

  private async getAllAvailableTracks(): Promise<string[]> {
    // Mock implementation
    const tracks: string[] = [];
    for (let i = 1; i <= 100; i++) {
      tracks.push(`track-${i}`);
    }
    return tracks;
  }

  private getTrackArtistId(trackId: string): string {
    return `artist-${this.simpleHash(trackId) % 50}`;
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