import type {
  RecommendationEngine,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationScore,
  RecommendationReason,
  UserBehavior,
  UserProfile,
  HomeFeed,
  HomeFeedSection,
  HomeFeedSectionType,
  Track,
  TrackFeatures,
  RecommendationAlgorithm,
  RecommendationContext,
  PopularityData,
} from '@/types';
import { musicDatabase } from '../data/music-database';
import { UserProfileManager } from './user-profile-manager';
import { ContentAnalyzer } from './content-analyzer';
import { CollaborativeFilter } from './collaborative-filter';
import { ContentBasedFilter } from './content-based-filter';
import { TrendingAnalyzer } from './trending-analyzer';
import { CacheManager } from './cache-manager';
import { ColdStartHandler } from './cold-start-handler';
import { abTestingManager } from './ab-testing';

export class SpotifyRecommendationEngine implements RecommendationEngine {
  private userProfileManager: UserProfileManager;
  private contentAnalyzer: ContentAnalyzer;
  private collaborativeFilter: CollaborativeFilter;
  private contentBasedFilter: ContentBasedFilter;
  private trendingAnalyzer: TrendingAnalyzer;
  private cacheManager: CacheManager;
  private coldStartHandler: ColdStartHandler;

  constructor() {
    this.userProfileManager = new UserProfileManager();
    this.contentAnalyzer = new ContentAnalyzer();
    this.collaborativeFilter = new CollaborativeFilter();
    this.contentBasedFilter = new ContentBasedFilter();
    this.trendingAnalyzer = new TrendingAnalyzer();
    this.cacheManager = new CacheManager();
    this.coldStartHandler = new ColdStartHandler();
  }

  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();

    // Check cache first
    const cachedResult = await this.cacheManager.get(request);
    if (cachedResult) {
      return {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          cacheHit: true,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // Get user profile
    const userProfile = await this.userProfileManager.getUserProfile(request.userId);
    
    // Determine context if not provided
    const context = request.context || this.getCurrentContext();

    // Check if user is in cold start phase
    if (this.coldStartHandler.isUserInColdStart(userProfile)) {
      return this.coldStartHandler.handleColdStart(request, userProfile, context);
    }

    // Get A/B test algorithm and parameters
    const abTestConfig = abTestingManager.getAlgorithmForSection(request.userId, request.sectionType);
    const algorithm = request.algorithm || abTestConfig.algorithm;
    
    // Apply A/B test parameters to request
    const enhancedRequest = {
      ...request,
      ...abTestConfig.parameters,
    };

    let recommendations: RecommendationScore[] = [];

    // Handle case where userProfile is null
    if (!userProfile) {
      return this.coldStartHandler.handleColdStart(
        { ...enhancedRequest, algorithm: 'content_based' },
        null,
        context
      );
    }

    try {
      switch (algorithm) {
        case 'collaborative_filtering':
          recommendations = await this.collaborativeFilter.recommend(enhancedRequest, userProfile, context);
          break;
        case 'content_based':
          recommendations = await this.contentBasedFilter.recommend(enhancedRequest, userProfile, context);
          break;
        case 'hybrid':
          recommendations = await this.generateHybridRecommendations(enhancedRequest, userProfile, context);
          break;
        case 'popularity_based':
          recommendations = await this.generatePopularityBasedRecommendations(enhancedRequest, context);
          break;
        case 'time_contextual':
          recommendations = await this.generateTimeContextualRecommendations(enhancedRequest, userProfile, context);
          break;
        case 'mood_based':
          recommendations = await this.generateMoodBasedRecommendations(enhancedRequest, userProfile, context);
          break;
        default:
          recommendations = await this.generateHybridRecommendations(enhancedRequest, userProfile, context);
      }

      // Apply diversity and freshness filters
      recommendations = this.applyDiversityAndFreshness(
        recommendations,
        request.diversityLevel || 'medium',
        request.freshnessLevel || 'medium'
      );

      // Limit results
      recommendations = recommendations.slice(0, request.limit);

      const response: RecommendationResponse = {
        tracks: recommendations,
        totalAvailable: recommendations.length,
        algorithm,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour TTL
        metadata: {
          processingTime: Date.now() - startTime,
          cacheHit: false,
          userProfileVersion: userProfile?.version || 1,
          abTestVariant: abTestConfig.variant,
        },
      };

      // Cache the result
      await this.cacheManager.set(request, response);

      return response;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback to popularity-based recommendations
      return this.generateFallbackRecommendations(request, context);
    }
  }

  private selectAlgorithm(
    request: RecommendationRequest,
    userProfile: UserProfile | null,
    _context: RecommendationContext
  ): RecommendationAlgorithm {
    // If algorithm is explicitly requested
    if (request.algorithm) {
      return request.algorithm;
    }

    // For new users with limited data, use popularity-based
    if (!userProfile || this.isNewUser(userProfile)) {
      return 'popularity_based';
    }

    // Time-sensitive sections use time contextual
    if (['morning_mix', 'evening_chill', 'workout_mix'].includes(request.sectionType)) {
      return 'time_contextual';
    }

    // Mood-based sections
    if (['mood_based', 'focus_music'].includes(request.sectionType)) {
      return 'mood_based';
    }

    // Trending sections
    if (['trending_now', 'charts', 'new_releases'].includes(request.sectionType)) {
      return 'popularity_based';
    }

    // Discovery sections use hybrid approach
    if (['discover_weekly', 'daily_mix', 'because_you_liked'].includes(request.sectionType)) {
      return 'hybrid';
    }

    // Default to hybrid for personalized content
    return 'hybrid';
  }

  private async generateHybridRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile | null,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    if (!userProfile) {
      return this.generatePopularityBasedRecommendations(request, context);
    }

    // Get recommendations from multiple algorithms
    const [collaborative, contentBased, popularity] = await Promise.all([
      this.collaborativeFilter.recommend(request, userProfile, context),
      this.contentBasedFilter.recommend(request, userProfile, context),
      this.generatePopularityBasedRecommendations(request, context),
    ]);

    // Blend recommendations with different weights
    const blendedRecommendations = new Map<string, RecommendationScore>();

    // Add collaborative filtering results (40% weight)
    collaborative.forEach(rec => {
      blendedRecommendations.set(rec.trackId, {
        ...rec,
        score: rec.score * 0.4,
        algorithm: 'hybrid' as RecommendationAlgorithm,
      });
    });

    // Add content-based results (35% weight)
    contentBased.forEach(rec => {
      const existing = blendedRecommendations.get(rec.trackId);
      if (existing) {
        existing.score += rec.score * 0.35;
        existing.reasons.push(...rec.reasons);
      } else {
        blendedRecommendations.set(rec.trackId, {
          ...rec,
          score: rec.score * 0.35,
          algorithm: 'hybrid' as RecommendationAlgorithm,
        });
      }
    });

    // Add popularity results (25% weight)
    popularity.forEach(rec => {
      const existing = blendedRecommendations.get(rec.trackId);
      if (existing) {
        existing.score += rec.score * 0.25;
        existing.reasons.push(...rec.reasons);
      } else {
        blendedRecommendations.set(rec.trackId, {
          ...rec,
          score: rec.score * 0.25,
          algorithm: 'hybrid' as RecommendationAlgorithm,
        });
      }
    });

    // Sort by final score and return
    return Array.from(blendedRecommendations.values())
      .sort((a, b) => b.score - a.score);
  }

  private async generatePopularityBasedRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const tracks = await musicDatabase.getAllTracks();
    const popularityData = await this.trendingAnalyzer.getPopularityData();

    return tracks
      .map(track => {
        const popularity = popularityData.find(p => p.trackId === track.id);
        const score = popularity ? this.calculatePopularityScore(track, popularity, context) : track.popularity / 100;

        return {
          trackId: track.id,
          score,
          reasons: [{
            type: 'trending' as const,
            weight: 1.0,
            explanation: `Popular track with ${popularity?.playCount || 'many'} plays`,
          }],
          algorithm: 'popularity_based' as RecommendationAlgorithm,
          context,
          freshness: this.calculateFreshness(track),
          diversity: 0.5, // Neutral diversity for popular tracks
        };
      })
      .filter(rec => !request.excludeTrackIds?.includes(rec.trackId))
      .sort((a, b) => b.score - a.score);
  }

  private async generateTimeContextualRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const timePreferences = userProfile.timeBasedPreferences[context.timeOfDay];
    const tracks = await musicDatabase.getTracksByGenres(timePreferences.preferredGenres);

    return tracks
      .map(track => {
        const score = this.calculateTimeContextualScore(track, {
          ...timePreferences,
          energyLevel: timePreferences.energyLevel === 'high' ? 0.8 : 
                       timePreferences.energyLevel === 'medium' ? 0.5 : 0.2
        }, context);
        
        return {
          trackId: track.id,
          score,
          reasons: [{
            type: 'time_based' as const,
            weight: 1.0,
            explanation: `Perfect for ${context.timeOfDay} listening based on your preferences`,
          }],
          algorithm: 'time_contextual' as RecommendationAlgorithm,
          context,
          freshness: this.calculateFreshness(track),
          diversity: this.calculateDiversity(track, userProfile),
        };
      })
      .filter(rec => !request.excludeTrackIds?.includes(rec.trackId))
      .sort((a, b) => b.score - a.score);
  }

  private async generateMoodBasedRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const tracks = await musicDatabase.getAllTracks();
    const userAudioPrefs = userProfile.audioFeaturePreferences;

    const validTracks = tracks
      .filter(track => {
        const trackFeatures = this.contentAnalyzer.getTrackFeatures(track.id);
        return trackFeatures !== null;
      })
      .map(track => {
        const trackFeatures = this.contentAnalyzer.getTrackFeatures(track.id)!;
        const score = this.calculateMoodScore(trackFeatures, userAudioPrefs as unknown as Record<string, number>, context);
        
        return {
          trackId: track.id,
          score,
          reasons: [{
            type: 'mood_based' as const,
            weight: 1.0,
            explanation: `Matches your ${context.mood} mood preferences`,
          }],
          algorithm: 'mood_based' as RecommendationAlgorithm,
          context,
          freshness: this.calculateFreshness(track),
          diversity: this.calculateDiversity(track, userProfile),
        };
      });

    return validTracks
      .filter(rec => !request.excludeTrackIds?.includes(rec.trackId))
      .sort((a, b) => b.score - a.score);
  }

  private calculatePopularityScore(
    track: Track,
    popularity: PopularityData,
    context: RecommendationContext
  ): number {
    let score = popularity.playCount / 1000000; // Normalize to millions of plays
    
    // Boost based on completion rate
    score *= popularity.completionRate;
    
    // Penalize high skip rate
    score *= (1 - popularity.skipRate);
    
    // Boost recent trending tracks
    if (popularity.lastUpdated > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      score *= 1.2;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateTimeContextualScore(
    track: Track,
    timePreferences: { preferredGenres: string[]; energyLevel: number },
    _context: RecommendationContext
  ): number {
    let score = 0.5; // Base score
    
    // Boost if genre matches time preferences
    if (track.genres.some(genre => timePreferences.preferredGenres.includes(genre))) {
      score += 0.3;
    }
    
    // Boost based on energy level match
    const trackFeatures = this.contentAnalyzer.getTrackFeatures(track.id);
    if (trackFeatures) {
      const energyMatch = 1 - Math.abs(trackFeatures.energy - timePreferences.energyLevel);
      score += energyMatch * 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateMoodScore(
    trackFeatures: TrackFeatures,
    userAudioPrefs: Record<string, number>,
    _context: RecommendationContext
  ): number {
    let score = 0;
    
    // Calculate similarity to user's audio feature preferences
    const features = ['danceability', 'energy', 'valence', 'acousticness'];
    features.forEach(feature => {
      const trackValue = trackFeatures[feature as keyof TrackFeatures] as number;
      const userPref = userAudioPrefs[feature];
      if (userPref !== undefined) {
        const similarity = 1 - Math.abs(trackValue - userPref);
        score += similarity * 0.25;
      }
    });
    
    return Math.min(score, 1.0);
  }

  private calculateEnergyMatch(trackEnergy: number, preferredEnergyLevel: string): number {
    const energyMap = { low: 0.3, medium: 0.6, high: 0.9 };
    const targetEnergy = energyMap[preferredEnergyLevel as keyof typeof energyMap];
    return 1 - Math.abs(trackEnergy - targetEnergy);
  }

  private calculateFreshness(track: Track): number {
    const daysSinceRelease = (Date.now() - track.releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRelease < 7) return 1.0; // Very fresh
    if (daysSinceRelease < 30) return 0.8; // Fresh
    if (daysSinceRelease < 90) return 0.6; // Moderately fresh
    if (daysSinceRelease < 365) return 0.4; // Somewhat old
    return 0.2; // Old
  }

  private calculateDiversity(track: Track, userProfile: UserProfile): number {
    // Calculate how different this track is from user's usual preferences
    const userGenres = userProfile.favoriteGenres.map(g => g.genre);
    const trackGenres = track.genres;
    
    const genreOverlap = trackGenres.filter(g => userGenres.includes(g)).length;
    const totalGenres = Math.max(trackGenres.length, 1);
    
    return 1 - (genreOverlap / totalGenres);
  }

  private applyDiversityAndFreshness(
    recommendations: RecommendationScore[],
    diversityLevel: 'low' | 'medium' | 'high',
    freshnessLevel: 'low' | 'medium' | 'high'
  ): RecommendationScore[] {
    const diversityWeight = { low: 0.1, medium: 0.2, high: 0.4 }[diversityLevel];
    const freshnessWeight = { low: 0.1, medium: 0.2, high: 0.4 }[freshnessLevel];

    return recommendations
      .map(rec => ({
        ...rec,
        score: rec.score + (rec.diversity * diversityWeight) + (rec.freshness * freshnessWeight),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private isNewUser(userProfile: UserProfile): boolean {
    const totalInteractions = userProfile.favoriteGenres.reduce((sum, g) => sum + g.playCount, 0);
    return totalInteractions < 50; // Less than 50 plays considered new user
  }

  private getCurrentContext(): RecommendationContext {
    const now = new Date();
    const hour = now.getHours();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
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
      dayOfWeek: day,
      season,
    };
  }

  private async generateFallbackRecommendations(
    request: RecommendationRequest,
    context: RecommendationContext
  ): Promise<RecommendationResponse> {
    const tracks = await musicDatabase.getAllTracks();
    const recommendations = tracks
      .slice(0, request.limit)
      .map(track => ({
        trackId: track.id,
        score: track.popularity / 100,
        reasons: [{
          type: 'trending' as const,
          weight: 1.0,
          explanation: 'Popular track recommended as fallback',
        }],
        algorithm: 'popularity_based' as RecommendationAlgorithm,
        context,
        freshness: 0.5,
        diversity: 0.5,
      }));

    return {
      tracks: recommendations,
      totalAvailable: recommendations.length,
      algorithm: 'popularity_based',
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL for fallback
      metadata: {
        processingTime: 100,
        cacheHit: false,
        userProfileVersion: 1,
      },
    };
  }

  async updateUserBehavior(behavior: UserBehavior): Promise<void> {
    await this.userProfileManager.updateUserBehavior(behavior);
  }

  async refreshUserProfile(userId: string): Promise<UserProfile> {
    return this.userProfileManager.refreshUserProfile(userId);
  }

  async getHomeFeed(userId: string, _refresh = false): Promise<HomeFeed> {
    const startTime = Date.now();
    
    // Get user profile to determine personalization level
    const userProfile = await this.userProfileManager.getUserProfile(userId);
    const isNewUser = !userProfile || this.isNewUser(userProfile);
    
    // Define sections based on user profile
    const sectionConfigs = this.getHomeFeedSectionConfigs(isNewUser, userProfile);
    
    // Generate recommendations for each section
    const sections: HomeFeedSection[] = [];
    
    for (const config of sectionConfigs) {
      try {
        const request = {
          userId,
          sectionType: config.type,
          limit: config.maxItems,
          context: this.getCurrentContext(),
        };
        
        const response = await this.generateRecommendations(request);
        
        const section: HomeFeedSection = {
          id: `${config.type}-${Date.now()}`,
          type: config.type,
          title: config.title,
          subtitle: config.subtitle,
          description: config.description,
          iconName: config.iconName,
          priority: config.priority,
          isPersonalized: config.isPersonalized,
          refreshable: config.refreshable,
          timeToLive: config.timeToLive,
          tracks: response.tracks,
          metadata: {
            generatedAt: new Date(),
            lastRefreshed: new Date(),
            algorithm: response.algorithm,
            userEngagement: {
              viewCount: 0,
              clickCount: 0,
              playCount: 0,
              skipCount: 0,
              likeCount: 0,
              shareCount: 0,
            },
          },
          displaySettings: config.displaySettings,
        };
        
        sections.push(section);
      } catch (error) {
        console.error(`Failed to generate section ${config.type}:`, error);
        // Continue with other sections
      }
    }
    
    // Calculate feed metadata
    const totalRecommendations = sections.reduce((sum, section) => sum + section.tracks.length, 0);
    const averageConfidence = totalRecommendations > 0 
      ? sections.reduce((sum, section) => 
          sum + section.tracks.reduce((trackSum, track) => trackSum + track.score, 0), 0
        ) / totalRecommendations
      : 0;
    
    const diversityScore = this.calculateFeedDiversity(sections);
    const freshnessScore = this.calculateFeedFreshness(sections);
    
    const homeFeed: HomeFeed = {
      userId,
      sections: sections.sort((a, b) => a.priority - b.priority),
      generatedAt: new Date(),
      lastRefreshed: new Date(),
      version: 1,
      metadata: {
        totalRecommendations,
        averageConfidence,
        diversityScore,
        freshnessScore,
        processingTime: Date.now() - startTime,
      },
    };
    
    return homeFeed;
  }

  async trainModels(): Promise<void> {
    // Implementation for model training
    await Promise.all([
      this.collaborativeFilter.trainModel(),
      this.contentBasedFilter.trainModel(),
      this.trendingAnalyzer.updateTrendingData(),
    ]);
  }

  async getRecommendationExplanation(trackId: string, userId: string): Promise<RecommendationReason[]> {
    const userProfile = await this.userProfileManager.getUserProfile(userId);
    if (!userProfile) return [];

    const track = await musicDatabase.getTrack(trackId);
    if (!track) return [];

    // Generate explanations based on user preferences
    const reasons: RecommendationReason[] = [];

    // Check genre preferences
    const userGenres = userProfile.favoriteGenres.map(g => g.genre);
    const matchingGenres = track.genres.filter(g => userGenres.includes(g));
    if (matchingGenres.length > 0) {
      reasons.push({
        type: 'similar_genre',
        weight: 0.8,
        explanation: `You often listen to ${matchingGenres.join(', ')}`,
        metadata: { genres: matchingGenres },
      });
    }

    // Check artist preferences
    const artistPref = userProfile.favoriteArtists.find(a => a.artistId === track.artist.id);
    if (artistPref) {
      reasons.push({
        type: 'similar_artist',
        weight: 0.9,
        explanation: `You've played ${artistPref.playCount} songs by ${track.artist.name}`,
        metadata: { artistId: track.artist.id, playCount: artistPref.playCount },
      });
    }

    return reasons;
  }

  private getHomeFeedSectionConfigs(isNewUser: boolean, userProfile: UserProfile | null) {
    const baseConfigs = [
      // For all users
      {
        type: 'trending_now' as HomeFeedSectionType,
        title: 'Trending Now',
        subtitle: 'What everyone is listening to',
        description: 'Popular tracks gaining momentum right now',
        iconName: 'trending-up',
        priority: isNewUser ? 1 : 8,
        isPersonalized: false,
        refreshable: true,
        timeToLive: 15, // 15 minutes
        maxItems: 15,
        displaySettings: {
          layout: 'horizontal_cards' as const,
          cardSize: 'medium' as const,
          showArtwork: true,
          showMetadata: true,
          showRecommendationReason: false,
          maxItems: 15,
        },
      },
      {
        type: 'new_releases' as HomeFeedSectionType,
        title: 'New Releases',
        subtitle: 'Fresh music from your favorite artists',
        description: 'Latest tracks and albums',
        iconName: 'clock',
        priority: isNewUser ? 2 : 9,
        isPersonalized: false,
        refreshable: true,
        timeToLive: 180, // 3 hours
        maxItems: 12,
        displaySettings: {
          layout: 'horizontal_cards' as const,
          cardSize: 'medium' as const,
          showArtwork: true,
          showMetadata: true,
          showRecommendationReason: false,
          maxItems: 12,
        },
      },
    ];

    if (!isNewUser && userProfile) {
      // Personalized sections for existing users
      const personalizedConfigs = [
        {
          type: 'discover_weekly' as HomeFeedSectionType,
          title: 'Discover Weekly',
          subtitle: 'Your weekly mixtape of fresh music',
          description: 'New music picks based on your taste',
          iconName: 'compass',
          priority: 1,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 60, // 1 hour
          maxItems: 20,
          displaySettings: {
            layout: 'hero' as const,
            cardSize: 'large' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: true,
            maxItems: 20,
          },
        },
        {
          type: 'daily_mix' as HomeFeedSectionType,
          title: 'Daily Mix',
          subtitle: 'Your favorite songs and new discoveries',
          description: 'Made for your taste',
          iconName: 'heart',
          priority: 2,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 30, // 30 minutes
          maxItems: 15,
          displaySettings: {
            layout: 'horizontal_cards' as const,
            cardSize: 'medium' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: true,
            maxItems: 15,
          },
        },
        {
          type: 'recently_played' as HomeFeedSectionType,
          title: 'Recently Played',
          subtitle: 'Jump back in where you left off',
          description: 'Your recent listening history',
          iconName: 'clock',
          priority: 3,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 10, // 10 minutes
          maxItems: 10,
          displaySettings: {
            layout: 'vertical_list' as const,
            cardSize: 'small' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: false,
            maxItems: 10,
          },
        },
        {
          type: 'because_you_liked' as HomeFeedSectionType,
          title: 'Because You Liked',
          subtitle: this.getBecauseYouLikedSubtitle(userProfile),
          description: 'More music you might enjoy',
          iconName: 'thumb-up',
          priority: 4,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 45, // 45 minutes
          maxItems: 12,
          displaySettings: {
            layout: 'horizontal_cards' as const,
            cardSize: 'medium' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: true,
            maxItems: 12,
          },
        },
        {
          type: 'heavy_rotation' as HomeFeedSectionType,
          title: 'On Repeat',
          subtitle: 'Your most played tracks lately',
          description: 'Songs you can\'t stop playing',
          iconName: 'repeat',
          priority: 5,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 60, // 1 hour
          maxItems: 8,
          displaySettings: {
            layout: 'horizontal_cards' as const,
            cardSize: 'small' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: false,
            maxItems: 8,
          },
        },
      ];

      // Add time-contextual sections
      const context = this.getCurrentContext();
      if (context.timeOfDay === 'morning') {
        personalizedConfigs.push({
          type: 'morning_mix' as HomeFeedSectionType,
          title: 'Morning Mix',
          subtitle: 'Start your day with good vibes',
          description: 'Perfect tracks for your morning',
          iconName: 'sun',
          priority: 6,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 30,
          maxItems: 10,
          displaySettings: {
            layout: 'horizontal_cards' as const,
            cardSize: 'medium' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: false,
            maxItems: 10,
          },
        });
      } else if (context.timeOfDay === 'evening') {
        personalizedConfigs.push({
          type: 'evening_chill' as HomeFeedSectionType,
          title: 'Evening Chill',
          subtitle: 'Wind down with relaxing music',
          description: 'Perfect for your evening mood',
          iconName: 'moon',
          priority: 6,
          isPersonalized: true,
          refreshable: true,
          timeToLive: 30,
          maxItems: 10,
          displaySettings: {
            layout: 'horizontal_cards' as const,
            cardSize: 'medium' as const,
            showArtwork: true,
            showMetadata: true,
            showRecommendationReason: false,
            maxItems: 10,
          },
        });
      }

      return [...personalizedConfigs, ...baseConfigs];
    }

    // For new users, focus on popular and trending content
    return [
      ...baseConfigs,
      {
        type: 'charts' as HomeFeedSectionType,
        title: 'Top Charts',
        subtitle: 'Most popular songs right now',
        description: 'What\'s hot in music',
        iconName: 'bar-chart',
        priority: 3,
        isPersonalized: false,
        refreshable: true,
        timeToLive: 60,
        maxItems: 15,
        displaySettings: {
          layout: 'vertical_list' as const,
          cardSize: 'small' as const,
          showArtwork: true,
          showMetadata: true,
          showRecommendationReason: false,
          maxItems: 15,
        },
      },
      {
        type: 'genre_based' as HomeFeedSectionType,
        title: 'Popular in Pop',
        subtitle: 'Top tracks in popular genres',
        description: 'Discover what\'s trending by genre',
        iconName: 'music',
        priority: 4,
        isPersonalized: false,
        refreshable: true,
        timeToLive: 120,
        maxItems: 12,
        displaySettings: {
          layout: 'horizontal_cards' as const,
          cardSize: 'medium' as const,
          showArtwork: true,
          showMetadata: true,
          showRecommendationReason: false,
          maxItems: 12,
        },
      },
    ];
  }

  private getBecauseYouLikedSubtitle(userProfile: UserProfile): string {
    if (!userProfile.favoriteArtists.length) return 'Discover new music';
    
    const topArtist = userProfile.favoriteArtists[0];
    if (!topArtist) return 'Discover new music';
    const artistName = this.getArtistName(topArtist.artistId);
    return `Similar to ${artistName}`;
  }

  private getArtistName(artistId: string): string {
    // Mock implementation - in real app would fetch from database
    return `Artist ${artistId.slice(-2)}`;
  }

  private calculateFeedDiversity(sections: HomeFeedSection[]): number {
    if (sections.length === 0) return 0;

    // Calculate diversity based on genre and artist variety
    const allGenres = new Set<string>();
    const allArtists = new Set<string>();
    
    sections.forEach(section => {
      section.tracks.forEach(track => {
        // Mock implementation - would get actual track data
        const mockGenres = [`genre-${track.trackId.slice(-1)}`];
        const mockArtistId = `artist-${track.trackId.slice(-2)}`;
        
        mockGenres.forEach(genre => allGenres.add(genre));
        allArtists.add(mockArtistId);
      });
    });

    const totalTracks = sections.reduce((sum, s) => sum + s.tracks.length, 0);
    const genreDiversity = allGenres.size / Math.max(totalTracks / 10, 1);
    const artistDiversity = allArtists.size / Math.max(totalTracks / 5, 1);
    
    return Math.min((genreDiversity + artistDiversity) / 2, 1.0);
  }

  private calculateFeedFreshness(sections: HomeFeedSection[]): number {
    if (sections.length === 0) return 0;

    let totalFreshness = 0;
    let totalTracks = 0;

    sections.forEach(section => {
      section.tracks.forEach(track => {
        totalFreshness += track.freshness;
        totalTracks++;
      });
    });

    return totalTracks > 0 ? totalFreshness / totalTracks : 0;
  }
}