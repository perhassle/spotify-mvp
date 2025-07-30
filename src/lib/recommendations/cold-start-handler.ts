import type {
  ColdStartStrategy,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationScore,
  UserProfile,
  RecommendationContext,
  Track,
} from '@/types';
import { musicDatabase } from '../data/music-database';
import { TrendingAnalyzer } from './trending-analyzer';

export class ColdStartHandler {
  private trendingAnalyzer: TrendingAnalyzer;

  constructor() {
    this.trendingAnalyzer = new TrendingAnalyzer();
  }

  async handleColdStart(
    request: RecommendationRequest,
    userProfile: UserProfile | null,
    context: RecommendationContext
  ): Promise<RecommendationResponse> {
    const strategy = this.selectColdStartStrategy(request, userProfile, context);
    
    let recommendations: RecommendationScore[] = [];

    switch (strategy.strategy) {
      case 'popularity_based':
        recommendations = await this.generatePopularityBasedRecommendations(request, context, strategy);
        break;
      case 'demographic_based':
        recommendations = await this.generateDemographicBasedRecommendations(request, context, strategy);
        break;
      case 'onboarding_based':
        recommendations = await this.generateOnboardingBasedRecommendations(request, context, strategy);
        break;
      case 'genre_exploration':
        recommendations = await this.generateGenreExplorationRecommendations(request, context, strategy);
        break;
      default:
        recommendations = await this.generatePopularityBasedRecommendations(request, context, strategy);
    }

    // Apply diversity boost for exploration
    recommendations = this.applyDiversityBoost(recommendations, strategy.diversityBoost);

    // Mix with some exploration content
    if (strategy.explorationWeight > 0) {
      const explorationRecs = await this.generateExplorationRecommendations(request, context);
      recommendations = this.mixRecommendations(recommendations, explorationRecs, strategy.explorationWeight);
    }

    return {
      tracks: recommendations.slice(0, request.limit),
      totalAvailable: recommendations.length,
      algorithm: strategy.fallbackAlgorithm,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      metadata: {
        processingTime: 100,
        cacheHit: false,
        userProfileVersion: userProfile?.version || 0,
      },
    };
  }

  private selectColdStartStrategy(
    request: RecommendationRequest,
    userProfile: UserProfile | null,
    context: RecommendationContext
  ): ColdStartStrategy {
    const interactionCount = userProfile 
      ? userProfile.favoriteGenres.reduce((sum, g) => sum + g.playCount, 0)
      : 0;

    // Very new users (< 5 interactions) - pure popularity
    if (interactionCount < 5) {
      return {
        strategy: 'popularity_based',
        minInteractions: 5,
        fallbackAlgorithm: 'popularity_based',
        diversityBoost: 0.3,
        explorationWeight: 0.2,
        popularityThreshold: 0.7,
      };
    }

    // New users (5-25 interactions) - demographic + genre exploration
    if (interactionCount < 25) {
      return {
        strategy: 'genre_exploration',
        minInteractions: 25,
        fallbackAlgorithm: 'content_based',
        diversityBoost: 0.4,
        explorationWeight: 0.3,
        popularityThreshold: 0.5,
      };
    }

    // Somewhat experienced users (25-50 interactions) - onboarding based
    if (interactionCount < 50) {
      return {
        strategy: 'onboarding_based',
        minInteractions: 50,
        fallbackAlgorithm: 'hybrid',
        diversityBoost: 0.2,
        explorationWeight: 0.1,
        popularityThreshold: 0.3,
      };
    }

    // Users with enough data - use regular algorithms
    return {
      strategy: 'demographic_based',
      minInteractions: 50,
      fallbackAlgorithm: 'hybrid',
      diversityBoost: 0.1,
      explorationWeight: 0.0,
      popularityThreshold: 0.1,
    };
  }

  private async generatePopularityBasedRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext,
    strategy: ColdStartStrategy
  ): Promise<RecommendationScore[]> {
    // Get popular tracks across all genres
    const popularTracks = await this.trendingAnalyzer.getPopularTracks(request.limit * 2);
    const trendingTracks = await this.trendingAnalyzer.getTrendingTracks(request.limit);

    const recommendations: RecommendationScore[] = [];

    // Add popular tracks (70% weight)
    for (const popularData of popularTracks.slice(0, Math.floor(request.limit * 0.7))) {
      const score = Math.min(popularData.playCount / 1000000, 1) * (1 - popularData.skipRate);
      
      recommendations.push({
        trackId: popularData.trackId,
        score,
        reasons: [{
          type: 'trending',
          weight: 1.0,
          explanation: `Popular with ${Math.floor(popularData.playCount / 1000)}K+ plays`,
          metadata: { playCount: popularData.playCount, algorithm: 'cold_start_popularity' },
        }],
        algorithm: 'popularity_based',
        context,
        freshness: 0.5,
        diversity: 0.3, // Lower diversity for popular content
      });
    }

    // Add trending tracks (30% weight)
    for (const trendingData of trendingTracks.slice(0, Math.floor(request.limit * 0.3))) {
      const score = Math.min(trendingData.velocity / 5, 1);
      
      recommendations.push({
        trackId: trendingData.trackId,
        score,
        reasons: [{
          type: 'trending',
          weight: 1.0,
          explanation: 'Trending now - gaining popularity fast',
          metadata: { velocity: trendingData.velocity, algorithm: 'cold_start_trending' },
        }],
        algorithm: 'popularity_based',
        context,
        freshness: 0.8,
        diversity: 0.4,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async generateGenreExplorationRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext,
    strategy: ColdStartStrategy
  ): Promise<RecommendationScore[]> {
    // Define popular genres for exploration
    const popularGenres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Indie', 'R&B', 'Country', 'Jazz'];
    const recommendations: RecommendationScore[] = [];

    // Get top tracks from each genre
    for (const genre of popularGenres) {
      const genrePopularity = await this.trendingAnalyzer.getGenrePopularity(genre);
      const topInGenre = genrePopularity.slice(0, 2); // Top 2 from each genre

      for (const trackData of topInGenre) {
        const score = Math.min(trackData.playCount / 500000, 1) * (1 - trackData.skipRate * 0.5);
        
        recommendations.push({
          trackId: trackData.trackId,
          score,
          reasons: [{
            type: 'similar_genre',
            weight: 1.0,
            explanation: `Popular in ${genre} - explore this genre`,
            metadata: { genre, playCount: trackData.playCount, algorithm: 'cold_start_genre_exploration' },
          }],
          algorithm: 'content_based',
          context,
          freshness: 0.6,
          diversity: 0.7, // High diversity for genre exploration
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit);
  }

  private async generateOnboardingBasedRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext,
    strategy: ColdStartStrategy
  ): Promise<RecommendationScore[]> {
    // Create onboarding playlists based on context and time
    const recommendations: RecommendationScore[] = [];

    // Time-based recommendations
    const timeBasedTracks = await this.getTimeBasedOnboardingTracks(context, request.limit / 3);
    recommendations.push(...timeBasedTracks);

    // Activity-based recommendations
    if (context.activity) {
      const activityTracks = await this.getActivityBasedOnboardingTracks(context.activity, request.limit / 3);
      recommendations.push(...activityTracks);
    }

    // Mood-based recommendations
    if (context.mood) {
      const moodTracks = await this.getMoodBasedOnboardingTracks(context.mood, request.limit / 3);
      recommendations.push(...moodTracks);
    }

    // Fill remaining with popular tracks
    if (recommendations.length < request.limit) {
      const remainingCount = request.limit - recommendations.length;
      const popularTracks = await this.trendingAnalyzer.getPopularTracks(remainingCount);
      
      for (const trackData of popularTracks.slice(0, remainingCount)) {
        recommendations.push({
          trackId: trackData.trackId,
          score: Math.min(trackData.playCount / 1000000, 1),
          reasons: [{
            type: 'trending',
            weight: 1.0,
            explanation: 'Popular choice for new listeners',
            metadata: { algorithm: 'cold_start_onboarding_popular' },
          }],
          algorithm: 'popularity_based',
          context,
          freshness: 0.5,
          diversity: 0.4,
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async generateDemographicBasedRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext,
    strategy: ColdStartStrategy
  ): Promise<RecommendationScore[]> {
    // Mock demographic-based recommendations
    // In a real app, this would use demographic data (age, location, etc.)
    
    const recommendations: RecommendationScore[] = [];
    
    // Get popular tracks for similar demographics
    const demographicTracks = await this.trendingAnalyzer.getPopularTracks(request.limit);
    
    for (const trackData of demographicTracks) {
      const score = Math.min(trackData.playCount / 1000000, 1) * 0.8; // Slight reduction for demographic matching
      
      recommendations.push({
        trackId: trackData.trackId,
        score,
        reasons: [{
          type: 'collaborative',
          weight: 1.0,
          explanation: 'Popular with listeners like you',
          metadata: { algorithm: 'cold_start_demographic' },
        }],
        algorithm: 'collaborative_filtering',
        context,
        freshness: 0.5,
        diversity: 0.5,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async getTimeBasedOnboardingTracks(
    context: RecommendationContext,
    limit: number
  ): Promise<RecommendationScore[]> {
    const timePreferences = {
      morning: { genres: ['Pop', 'Indie', 'Electronic'], energy: 0.7 },
      afternoon: { genres: ['Rock', 'Hip Hop', 'Electronic'], energy: 0.8 },
      evening: { genres: ['R&B', 'Jazz', 'Indie'], energy: 0.5 },
      night: { genres: ['Ambient', 'Jazz', 'Classical'], energy: 0.3 },
    };

    const prefs = timePreferences[context.timeOfDay];
    const tracks = await musicDatabase.getTracksByGenres(prefs.genres);
    
    return tracks.slice(0, limit).map(track => ({
      trackId: track.id,
      score: 0.7 + (Math.random() * 0.2), // 0.7-0.9 range
      reasons: [{
        type: 'time_based',
        weight: 1.0,
        explanation: `Perfect for ${context.timeOfDay} listening`,
        metadata: { timeOfDay: context.timeOfDay, algorithm: 'cold_start_time_based' },
      }],
      algorithm: 'time_contextual',
      context,
      freshness: 0.6,
      diversity: 0.6,
    }));
  }

  private async getActivityBasedOnboardingTracks(
    activity: string,
    limit: number
  ): Promise<RecommendationScore[]> {
    const activityPreferences = {
      workout: { genres: ['Electronic', 'Hip Hop', 'Rock'], energy: 0.9 },
      study: { genres: ['Ambient', 'Classical', 'Jazz'], energy: 0.3 },
      party: { genres: ['Pop', 'Electronic', 'Hip Hop'], energy: 0.9 },
      commute: { genres: ['Pop', 'Indie', 'Rock'], energy: 0.6 },
      relaxing: { genres: ['Jazz', 'Ambient', 'Classical'], energy: 0.3 },
      work: { genres: ['Ambient', 'Electronic', 'Jazz'], energy: 0.4 },
    };

    const prefs = activityPreferences[activity as keyof typeof activityPreferences];
    if (!prefs) return [];

    const tracks = await musicDatabase.getTracksByGenres(prefs.genres);
    
    return tracks.slice(0, limit).map(track => ({
      trackId: track.id,
      score: 0.6 + (Math.random() * 0.3), // 0.6-0.9 range
      reasons: [{
        type: 'mood_based',
        weight: 1.0,
        explanation: `Great for ${activity}`,
        metadata: { activity, algorithm: 'cold_start_activity_based' },
      }],
      algorithm: 'mood_based',
      context: { 
        timeOfDay: 'morning', 
        dayOfWeek: 'monday',
        season: 'spring',
        location: undefined,
        device: undefined,
        activity 
      } as RecommendationContext,
      freshness: 0.5,
      diversity: 0.7,
    }));
  }

  private async getMoodBasedOnboardingTracks(
    mood: string,
    limit: number
  ): Promise<RecommendationScore[]> {
    const moodPreferences = {
      happy: { genres: ['Pop', 'Dance Pop', 'Indie'], valence: 0.8 },
      sad: { genres: ['Indie', 'Alternative', 'Folk'], valence: 0.3 },
      energetic: { genres: ['Electronic', 'Rock', 'Hip Hop'], valence: 0.7, energy: 0.8 },
      calm: { genres: ['Ambient', 'Jazz', 'Classical'], valence: 0.5, energy: 0.3 },
      focused: { genres: ['Ambient', 'Classical', 'Electronic'], valence: 0.5, energy: 0.4 },
      nostalgic: { genres: ['Classic Rock', 'Folk', 'Jazz'], valence: 0.4 },
    };

    const prefs = moodPreferences[mood as keyof typeof moodPreferences];
    if (!prefs) return [];

    const tracks = await musicDatabase.getTracksByGenres(prefs.genres);
    
    return tracks.slice(0, limit).map(track => ({
      trackId: track.id,
      score: 0.65 + (Math.random() * 0.25), // 0.65-0.9 range
      reasons: [{
        type: 'mood_based',
        weight: 1.0,
        explanation: `Matches your ${mood} mood`,
        metadata: { mood, algorithm: 'cold_start_mood_based' },
      }],
      algorithm: 'mood_based',
      context: { 
        timeOfDay: 'morning', 
        dayOfWeek: 'monday',
        season: 'spring',
        location: undefined,
        device: undefined,
        mood 
      } as RecommendationContext,
      freshness: 0.5,
      diversity: 0.6,
    }));
  }

  private async generateExplorationRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    // Generate diverse exploration content
    const allTracks = await musicDatabase.getAllTracks();
    const explorationTracks = this.shuffleArray(allTracks).slice(0, request.limit);
    
    return explorationTracks.map(track => ({
      trackId: track.id,
      score: 0.4 + (Math.random() * 0.3), // 0.4-0.7 range
      reasons: [{
        type: 'collaborative',
        weight: 1.0,
        explanation: 'Discover something new',
        metadata: { algorithm: 'cold_start_exploration' },
      }],
      algorithm: 'hybrid',
      context,
      freshness: 0.8,
      diversity: 0.9, // Very high diversity for exploration
    }));
  }

  private applyDiversityBoost(
    recommendations: RecommendationScore[],
    diversityBoost: number
  ): RecommendationScore[] {
    return recommendations.map(rec => ({
      ...rec,
      score: rec.score + (rec.diversity * diversityBoost),
    }));
  }

  private mixRecommendations(
    primary: RecommendationScore[],
    exploration: RecommendationScore[],
    explorationWeight: number
  ): RecommendationScore[] {
    const explorationCount = Math.floor(primary.length * explorationWeight);
    const primaryCount = primary.length - explorationCount;
    
    return [
      ...primary.slice(0, primaryCount),
      ...exploration.slice(0, explorationCount),
    ].sort((a, b) => b.score - a.score);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      if (temp !== undefined && shuffled[j] !== undefined) {
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
    }
    return shuffled;
  }

  // Method to check if user is in cold start phase
  isUserInColdStart(userProfile: UserProfile | null): boolean {
    if (!userProfile) return true;
    
    const totalInteractions = userProfile.favoriteGenres.reduce((sum, g) => sum + g.playCount, 0);
    return totalInteractions < 50;
  }

  // Method to get cold start onboarding recommendations for new users
  async getOnboardingRecommendations(userId: string): Promise<{
    genres: { name: string; tracks: RecommendationScore[] }[];
    moods: { name: string; tracks: RecommendationScore[] }[];
    activities: { name: string; tracks: RecommendationScore[] }[];
  }> {
    const context = this.getCurrentContext();
    
    // Popular genres with sample tracks
    const genres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Indie', 'Jazz'];
    const genreRecs = await Promise.all(
      genres.map(async (genre) => {
        const tracks = await musicDatabase.getTracksByGenres([genre]);
        return {
          name: genre,
          tracks: tracks.slice(0, 5).map(track => ({
            trackId: track.id,
            score: 0.8,
            reasons: [{
              type: 'similar_genre' as const,
              weight: 1.0,
              explanation: `Popular in ${genre}`,
            }],
            algorithm: 'content_based' as const,
            context,
            freshness: 0.5,
            diversity: 0.7,
          })),
        };
      })
    );

    // Popular moods
    const moods = ['happy', 'energetic', 'calm', 'focused'];
    const moodRecs = await Promise.all(
      moods.map(async (mood) => {
        const tracks = await this.getMoodBasedOnboardingTracks(mood, 5);
        return {
          name: mood,
          tracks,
        };
      })
    );

    // Popular activities
    const activities = ['workout', 'study', 'party', 'commute'];
    const activityRecs = await Promise.all(
      activities.map(async (activity) => {
        const tracks = await this.getActivityBasedOnboardingTracks(activity, 5);
        return {
          name: activity,
          tracks,
        };
      })
    );

    return {
      genres: genreRecs,
      moods: moodRecs,
      activities: activityRecs,
    };
  }

  private getCurrentContext(): RecommendationContext {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const month = now.getMonth();
    let season: 'spring' | 'summer' | 'fall' | 'winter';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    return {
      timeOfDay,
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      season,
    };
  }
}