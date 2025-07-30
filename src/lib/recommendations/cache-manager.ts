import type {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationCache,
  HomeFeedSectionType,
} from '@/types';

export class CacheManager {
  private cache: Map<string, RecommendationCache> = new Map();
  private maxCacheSize = 1000;
  private defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds

  async get(request: RecommendationRequest): Promise<RecommendationResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() > cached.expiresAt.getTime()) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Update access statistics
    cached.hitCount++;
    cached.lastAccessed = new Date();

    // Convert cached data back to RecommendationResponse format
    return {
      tracks: cached.recommendations,
      totalAvailable: cached.recommendations.length,
      algorithm: cached.algorithm,
      generatedAt: cached.generatedAt,
      validUntil: cached.expiresAt,
      metadata: {
        processingTime: 0, // Cache hit - no processing time
        cacheHit: true,
        userProfileVersion: 1, // Would need to store this in cache
      },
    };
  }

  async set(request: RecommendationRequest, response: RecommendationResponse): Promise<void> {
    // Don't cache if response is empty or error
    if (!response.tracks || response.tracks.length === 0) {
      return;
    }

    const cacheKey = this.generateCacheKey(request);
    const ttl = this.getTTLForSectionType(request.sectionType);
    
    const cacheEntry: RecommendationCache = {
      userId: request.userId,
      sectionType: request.sectionType,
      recommendations: response.tracks,
      generatedAt: response.generatedAt,
      expiresAt: new Date(Date.now() + ttl),
      hitCount: 0,
      lastAccessed: new Date(),
      context: request.context || this.getDefaultContext(),
      algorithm: response.algorithm,
    };

    // Ensure cache doesn't exceed maximum size
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldEntries();
    }

    this.cache.set(cacheKey, cacheEntry);
  }

  async invalidateUser(userId: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async invalidateSection(userId: string, sectionType: HomeFeedSectionType): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId && entry.sectionType === sectionType) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async warmupCache(userId: string, sectionTypes: HomeFeedSectionType[]): Promise<void> {
    // Pre-generate cache entries for common sections
    // This would typically be called during off-peak hours
    console.log(`Warming up cache for user ${userId} with sections: ${sectionTypes.join(', ')}`);
    
    // In a real implementation, this would trigger background recommendation generation
    // for the specified user and section types
  }

  getCacheStats(): {
    totalEntries: number;
    averageHitCount: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    cacheHitRatio: number;
  } {
    if (this.cache.size === 0) {
      return {
        totalEntries: 0,
        averageHitCount: 0,
        oldestEntry: null,
        newestEntry: null,
        cacheHitRatio: 0,
      };
    }

    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const dates = entries.map(entry => entry.generatedAt);
    
    return {
      totalEntries: this.cache.size,
      averageHitCount: totalHits / entries.length,
      oldestEntry: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestEntry: new Date(Math.max(...dates.map(d => d.getTime()))),
      cacheHitRatio: totalHits > 0 ? totalHits / (totalHits + entries.length) : 0,
    };
  }

  clearExpiredEntries(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt.getTime()) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  private generateCacheKey(request: RecommendationRequest): string {
    // Create a unique cache key based on request parameters
    const keyComponents = [
      request.userId,
      request.sectionType,
      request.limit,
      request.algorithm || 'default',
      request.diversityLevel || 'medium',
      request.freshnessLevel || 'medium',
      (request.excludeTrackIds || []).sort().join(','),
      (request.seedTracks || []).sort().join(','),
      (request.seedArtists || []).sort().join(','),
      (request.seedGenres || []).sort().join(','),
    ];

    // Include context if available
    if (request.context) {
      keyComponents.push(
        request.context.timeOfDay,
        request.context.dayOfWeek,
        request.context.season,
        request.context.activity || '',
        request.context.mood || '',
        request.context.location || ''
      );
    }

    return keyComponents.join('|');
  }

  private getTTLForSectionType(sectionType: HomeFeedSectionType): number {
    // Different section types have different cache durations
    const ttlMap: Record<HomeFeedSectionType, number> = {
      // Personal sections - shorter TTL for personalization
      'discover_weekly': 60 * 60 * 1000, // 1 hour
      'daily_mix': 30 * 60 * 1000, // 30 minutes
      'release_radar': 120 * 60 * 1000, // 2 hours
      'recently_played': 10 * 60 * 1000, // 10 minutes
      'jump_back_in': 15 * 60 * 1000, // 15 minutes
      'heavy_rotation': 60 * 60 * 1000, // 1 hour
      'because_you_liked': 45 * 60 * 1000, // 45 minutes
      'similar_artists': 90 * 60 * 1000, // 1.5 hours
      
      // Trending/popular - medium TTL
      'trending_now': 15 * 60 * 1000, // 15 minutes
      'new_releases': 180 * 60 * 1000, // 3 hours
      'charts': 60 * 60 * 1000, // 1 hour
      
      // Time-based - shorter TTL
      'morning_mix': 30 * 60 * 1000, // 30 minutes
      'evening_chill': 30 * 60 * 1000, // 30 minutes
      'workout_mix': 120 * 60 * 1000, // 2 hours
      'focus_music': 180 * 60 * 1000, // 3 hours
      
      // Social - short TTL for freshness
      'friends_listening': 5 * 60 * 1000, // 5 minutes
      'popular_in_network': 30 * 60 * 1000, // 30 minutes
      
      // Generic categories - longer TTL
      'genre_based': 240 * 60 * 1000, // 4 hours
      'mood_based': 90 * 60 * 1000, // 1.5 hours
      'activity_based': 120 * 60 * 1000, // 2 hours
    };

    return ttlMap[sectionType] || this.defaultTTL;
  }

  private evictOldEntries(): void {
    // Remove 10% of cache entries, starting with least recently accessed
    const entriesToRemove = Math.floor(this.maxCacheSize * 0.1);
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());
    
    // Remove oldest entries
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        this.cache.delete(entry[0]);
      }
    }
  }

  private getDefaultContext() {
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

  // Periodic maintenance method
  async performMaintenance(): Promise<void> {
    const expiredCount = this.clearExpiredEntries();
    
    // If cache is still too full, perform additional eviction
    if (this.cache.size > this.maxCacheSize * 0.9) {
      this.evictOldEntries();
    }

    console.log(`Cache maintenance completed. Removed ${expiredCount} expired entries. Current cache size: ${this.cache.size}`);
  }
}