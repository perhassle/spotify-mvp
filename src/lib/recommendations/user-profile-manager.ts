import type {
  UserProfile,
  UserBehavior,
  GenrePreference,
  ArtistPreference,
  ListeningPattern,
  SkipBehavior,
  AudioFeaturePreferences,
  TimeBasedPreferences,
  SocialPreferences,
} from '@/types';

export class UserProfileManager {
  private profiles: Map<string, UserProfile> = new Map();
  private behaviors: Map<string, UserBehavior[]> = new Map();

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Try to get from cache first
    let profile: UserProfile | null = this.profiles.get(userId) || null;
    
    if (!profile) {
      // In a real app, this would fetch from database
      profile = await this.buildUserProfile(userId);
      if (profile) {
        this.profiles.set(userId, profile);
      }
    }

    return profile || null;
  }

  async updateUserBehavior(behavior: UserBehavior): Promise<void> {
    const userId = behavior.userId;
    
    // Store behavior
    if (!this.behaviors.has(userId)) {
      this.behaviors.set(userId, []);
    }
    
    const behaviors = this.behaviors.get(userId)!;
    behaviors.push(behavior);
    
    // Keep only last 1000 behaviors per user
    if (behaviors.length > 1000) {
      behaviors.splice(0, behaviors.length - 1000);
    }

    // Update user profile based on new behavior
    await this.updateProfileFromBehavior(userId, behavior);
  }

  async refreshUserProfile(userId: string): Promise<UserProfile> {
    const behaviors = this.behaviors.get(userId) || [];
    const profile = await this.buildUserProfileFromBehaviors(userId, behaviors);
    
    this.profiles.set(userId, profile);
    return profile;
  }

  private async buildUserProfile(userId: string): Promise<UserProfile | null> {
    const behaviors = this.behaviors.get(userId);
    if (!behaviors || behaviors.length === 0) {
      return this.createDefaultProfile(userId);
    }

    return this.buildUserProfileFromBehaviors(userId, behaviors);
  }

  private async buildUserProfileFromBehaviors(
    userId: string,
    behaviors: UserBehavior[]
  ): Promise<UserProfile> {
    const favoriteGenres = this.calculateGenrePreferences(behaviors);
    const favoriteArtists = this.calculateArtistPreferences(behaviors);
    const listeningPatterns = this.calculateListeningPatterns(behaviors);
    const skipBehavior = this.calculateSkipBehavior(behaviors);
    const audioFeaturePreferences = this.calculateAudioFeaturePreferences(behaviors);
    const timeBasedPreferences = this.calculateTimeBasedPreferences(behaviors);
    const socialPreferences = this.calculateSocialPreferences(behaviors);

    return {
      userId,
      favoriteGenres,
      favoriteArtists,
      listeningPatterns,
      skipBehavior,
      audioFeaturePreferences,
      timeBasedPreferences,
      socialPreferences,
      lastUpdated: new Date(),
      version: this.getProfileVersion(userId),
    };
  }

  private calculateGenrePreferences(behaviors: UserBehavior[]): GenrePreference[] {
    const genreStats = new Map<string, {
      playCount: number;
      skipCount: number;
      totalListenTime: number;
      recentActivity: Date;
    }>();

    // Process behaviors to collect genre statistics
    behaviors.forEach(behavior => {
      if (behavior.action === 'play' || behavior.action === 'skip') {
        // In a real app, we'd fetch track details to get genres
        // For now, we'll use mock data based on trackId
        const genres = this.getTrackGenres(behavior.trackId);
        
        genres.forEach(genre => {
          if (!genreStats.has(genre)) {
            genreStats.set(genre, {
              playCount: 0,
              skipCount: 0,
              totalListenTime: 0,
              recentActivity: behavior.timestamp,
            });
          }

          const stats = genreStats.get(genre)!;
          
          if (behavior.action === 'play') {
            stats.playCount++;
            stats.totalListenTime += behavior.listenDuration || 0;
          } else if (behavior.action === 'skip') {
            stats.skipCount++;
          }
          
          if (behavior.timestamp > stats.recentActivity) {
            stats.recentActivity = behavior.timestamp;
          }
        });
      }
    });

    // Convert to GenrePreference objects
    return Array.from(genreStats.entries())
      .map(([genre, stats]) => {
        const totalInteractions = stats.playCount + stats.skipCount;
        const skipRate = totalInteractions > 0 ? stats.skipCount / totalInteractions : 0;
        const averageListenTime = stats.playCount > 0 ? stats.totalListenTime / stats.playCount : 0;
        
        // Calculate preference score based on play count, skip rate, and listen time
        let score = stats.playCount / Math.max(totalInteractions, 1);
        score *= (1 - Math.min(skipRate * 2, 1)); // Penalize high skip rates
        score *= Math.min(averageListenTime / 30, 1); // Boost for longer listen times
        
        return {
          genre,
          score: Math.max(0, Math.min(1, score)),
          playCount: stats.playCount,
          skipRate,
          averageListenTime,
          recentActivity: stats.recentActivity,
        };
      })
      .filter(pref => pref.playCount > 0) // Only include genres that were actually played
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Keep top 20 genres
  }

  private calculateArtistPreferences(behaviors: UserBehavior[]): ArtistPreference[] {
    const artistStats = new Map<string, {
      playCount: number;
      skipCount: number;
      lastPlayed: Date;
      followStatus: boolean;
    }>();

    behaviors.forEach(behavior => {
      if (behavior.action === 'play' || behavior.action === 'skip') {
        const artistId = this.getTrackArtistId(behavior.trackId);
        
        if (!artistStats.has(artistId)) {
          artistStats.set(artistId, {
            playCount: 0,
            skipCount: 0,
            lastPlayed: behavior.timestamp,
            followStatus: false, // Would be fetched from user's follow list
          });
        }

        const stats = artistStats.get(artistId)!;
        
        if (behavior.action === 'play') {
          stats.playCount++;
          stats.lastPlayed = behavior.timestamp;
        } else if (behavior.action === 'skip') {
          stats.skipCount++;
        }
      }
    });

    return Array.from(artistStats.entries())
      .map(([artistId, stats]) => {
        const totalInteractions = stats.playCount + stats.skipCount;
        const skipRate = totalInteractions > 0 ? stats.skipCount / totalInteractions : 0;
        
        // Calculate preference score
        let score = stats.playCount / Math.max(totalInteractions, 1);
        score *= (1 - Math.min(skipRate * 2, 1));
        
        // Boost for followed artists
        if (stats.followStatus) {
          score *= 1.2;
        }
        
        return {
          artistId,
          score: Math.max(0, Math.min(1, score)),
          playCount: stats.playCount,
          skipRate,
          followStatus: stats.followStatus,
          lastPlayed: stats.lastPlayed,
        };
      })
      .filter(pref => pref.playCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // Keep top 50 artists
  }

  private calculateListeningPatterns(behaviors: UserBehavior[]): ListeningPattern[] {
    const patterns = new Map<string, {
      genres: Map<string, number>;
      sessionLengths: number[];
      energyLevels: number[];
      moodTags: string[];
    }>();

    behaviors.forEach(behavior => {
      if (behavior.action === 'play') {
        const timeOfDay = behavior.timeOfDay;
        const dayOfWeek = this.getDayOfWeek(behavior.timestamp);
        const key = `${timeOfDay}-${dayOfWeek}`;
        
        if (!patterns.has(key)) {
          patterns.set(key, {
            genres: new Map(),
            sessionLengths: [],
            energyLevels: [],
            moodTags: [],
          });
        }

        const pattern = patterns.get(key)!;
        
        // Track genres
        const genres = this.getTrackGenres(behavior.trackId);
        genres.forEach(genre => {
          pattern.genres.set(genre, (pattern.genres.get(genre) || 0) + 1);
        });

        // Track session length (mock implementation)
        if (behavior.listenDuration) {
          pattern.sessionLengths.push(behavior.listenDuration);
        }

        // Track energy level (mock - would analyze audio features)
        pattern.energyLevels.push(0.5 + Math.random() * 0.5);
      }
    });

    return Array.from(patterns.entries()).map(([key, data]) => {
      const [timeOfDay, dayOfWeek] = key.split('-') as [
        'morning' | 'afternoon' | 'evening' | 'night',
        'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
      ];

      const preferredGenres = Array.from(data.genres.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre);

      const averageSessionLength = data.sessionLengths.length > 0 
        ? data.sessionLengths.reduce((a, b) => a + b, 0) / data.sessionLengths.length
        : 0;

      const averageEnergy = data.energyLevels.length > 0
        ? data.energyLevels.reduce((a, b) => a + b, 0) / data.energyLevels.length
        : 0.5;

      const energyLevel = averageEnergy < 0.4 ? 'low' : averageEnergy < 0.7 ? 'medium' : 'high';

      return {
        timeOfDay,
        dayOfWeek,
        preferredGenres,
        averageSessionLength,
        energyLevel: energyLevel as 'low' | 'medium' | 'high',
        moodTags: data.moodTags,
      };
    });
  }

  private calculateSkipBehavior(behaviors: UserBehavior[]): SkipBehavior {
    const skipBehaviors = behaviors.filter(b => b.action === 'skip');
    const playBehaviors = behaviors.filter(b => b.action === 'play');
    
    const totalSkips = skipBehaviors.length;
    const totalPlays = playBehaviors.length;
    const skipRate = totalPlays > 0 ? totalSkips / (totalSkips + totalPlays) : 0;

    // Calculate average skip point (mock implementation)
    const skipPoints = skipBehaviors
      .map(b => b.listenDuration || 10) // Default 10 seconds if not specified
      .filter(duration => duration > 0);
    
    const averageSkipPoint = skipPoints.length > 0 
      ? skipPoints.reduce((a, b) => a + b, 0) / skipPoints.length
      : 30;

    // Calculate skip reasons by genre
    const skipReasons: Record<string, number> = {};
    skipBehaviors.forEach(behavior => {
      const genres = this.getTrackGenres(behavior.trackId);
      genres.forEach(genre => {
        skipReasons[genre] = (skipReasons[genre] || 0) + 1;
      });
    });

    return {
      totalSkips,
      skipRate,
      averageSkipPoint,
      skipReasons,
      patterns: {
        skipAfterRepeat: skipRate > 0.7, // High skip rate might indicate skipping after repetition
        skipSimilarArtists: false, // Would need more sophisticated analysis
        skipLongTracks: averageSkipPoint < 60, // Skip early in long tracks
      },
    };
  }

  private calculateAudioFeaturePreferences(_behaviors: UserBehavior[]): AudioFeaturePreferences {
    // Mock implementation - in a real app, this would analyze actual audio features
    // of tracks the user played vs skipped
    return {
      danceability: 0.6,
      energy: 0.7,
      valence: 0.5,
      acousticness: 0.3,
      instrumentalness: 0.1,
      tempo: {
        min: 60,
        max: 140,
        preferred: 120,
      },
      loudness: {
        min: -20,
        max: -5,
        preferred: -10,
      },
    };
  }

  private calculateTimeBasedPreferences(behaviors: UserBehavior[]): TimeBasedPreferences {
    const timePreferences = {
      morning: { preferredGenres: [] as string[], energyLevel: 'medium' as const, moodTags: [] as string[] },
      afternoon: { preferredGenres: [] as string[], energyLevel: 'high' as const, moodTags: [] as string[] },
      evening: { preferredGenres: [] as string[], energyLevel: 'medium' as const, moodTags: [] as string[] },
      night: { preferredGenres: [] as string[], energyLevel: 'low' as const, moodTags: [] as string[] },
    };

    // Group behaviors by time of day
    const timeGroups = {
      morning: behaviors.filter(b => b.timeOfDay === 'morning' && b.action === 'play'),
      afternoon: behaviors.filter(b => b.timeOfDay === 'afternoon' && b.action === 'play'),
      evening: behaviors.filter(b => b.timeOfDay === 'evening' && b.action === 'play'),
      night: behaviors.filter(b => b.timeOfDay === 'night' && b.action === 'play'),
    };

    // Calculate preferences for each time period
    Object.entries(timeGroups).forEach(([timeOfDay, timeBehaviors]) => {
      const genreCounts = new Map<string, number>();
      
      timeBehaviors.forEach(behavior => {
        const genres = this.getTrackGenres(behavior.trackId);
        genres.forEach(genre => {
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        });
      });

      const topGenres = Array.from(genreCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);

      timePreferences[timeOfDay as keyof typeof timePreferences].preferredGenres = topGenres;
    });

    return timePreferences;
  }

  private calculateSocialPreferences(behaviors: UserBehavior[]): SocialPreferences {
    const shareBehaviors = behaviors.filter(b => b.action === 'share');
    const totalBehaviors = behaviors.length;

    return {
      shareFrequency: totalBehaviors > 0 ? shareBehaviors.length / totalBehaviors : 0,
      followsInfluencers: false, // Would be calculated from user's follow list
      discoveryThroughFriends: false, // Would track source of recommendations
      collaborativePlaylistParticipation: 0, // Would track playlist collaboration
      trendsFollowing: false, // Would track if user follows trending content
    };
  }

  private async updateProfileFromBehavior(userId: string, behavior: UserBehavior): Promise<void> {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    // Increment version for cache invalidation
    profile.version++;
    profile.lastUpdated = new Date();

    // Quick updates based on behavior type
    if (behavior.action === 'play') {
      // Update genre preferences
      const genres = this.getTrackGenres(behavior.trackId);
      genres.forEach(genre => {
        const existing = profile.favoriteGenres.find(g => g.genre === genre);
        if (existing) {
          existing.playCount++;
          existing.recentActivity = behavior.timestamp;
          // Recalculate score
          const totalInteractions = existing.playCount + (existing.skipRate * existing.playCount);
          existing.score = existing.playCount / Math.max(totalInteractions, 1);
        } else {
          profile.favoriteGenres.push({
            genre,
            score: 1.0,
            playCount: 1,
            skipRate: 0,
            averageListenTime: behavior.listenDuration || 0,
            recentActivity: behavior.timestamp,
          });
        }
      });

      // Update artist preferences
      const artistId = this.getTrackArtistId(behavior.trackId);
      const existingArtist = profile.favoriteArtists.find(a => a.artistId === artistId);
      if (existingArtist) {
        existingArtist.playCount++;
        existingArtist.lastPlayed = behavior.timestamp;
      } else {
        profile.favoriteArtists.push({
          artistId,
          score: 1.0,
          playCount: 1,
          skipRate: 0,
          followStatus: false,
          lastPlayed: behavior.timestamp,
        });
      }
    }
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      favoriteGenres: [],
      favoriteArtists: [],
      listeningPatterns: [],
      skipBehavior: {
        totalSkips: 0,
        skipRate: 0,
        averageSkipPoint: 30,
        skipReasons: {},
        patterns: {
          skipAfterRepeat: false,
          skipSimilarArtists: false,
          skipLongTracks: false,
        },
      },
      audioFeaturePreferences: {
        danceability: 0.5,
        energy: 0.5,
        valence: 0.5,
        acousticness: 0.5,
        instrumentalness: 0.5,
        tempo: { min: 60, max: 200, preferred: 120 },
        loudness: { min: -30, max: 0, preferred: -10 },
      },
      timeBasedPreferences: {
        morning: { preferredGenres: ['Pop', 'Indie'], energyLevel: 'medium', moodTags: ['uplifting'] },
        afternoon: { preferredGenres: ['Rock', 'Electronic'], energyLevel: 'high', moodTags: ['energetic'] },
        evening: { preferredGenres: ['Jazz', 'Folk'], energyLevel: 'medium', moodTags: ['relaxing'] },
        night: { preferredGenres: ['Ambient', 'Classical'], energyLevel: 'low', moodTags: ['calm'] },
      },
      socialPreferences: {
        shareFrequency: 0,
        followsInfluencers: false,
        discoveryThroughFriends: false,
        collaborativePlaylistParticipation: 0,
        trendsFollowing: false,
      },
      lastUpdated: new Date(),
      version: 1,
    };
  }

  private getProfileVersion(userId: string): number {
    const profile = this.profiles.get(userId);
    return profile ? profile.version + 1 : 1;
  }

  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()] || 'sunday';
  }

  // Mock methods - in a real app, these would fetch from database/music service
  private getTrackGenres(trackId: string): string[] {
    // Mock implementation - would fetch actual track data
    const mockGenres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Indie', 'Jazz', 'Classical', 'Country', 'R&B', 'Folk'];
    const hash = this.simpleHash(trackId);
    const count = (hash % 3) + 1; // 1-3 genres per track
    const genres: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const genreIndex = (hash + i * 7) % mockGenres.length;
      const genre = mockGenres[genreIndex];
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    }
    
    return genres;
  }

  private getTrackArtistId(trackId: string): string {
    // Mock implementation - would fetch actual track data
    return `artist-${this.simpleHash(trackId) % 100}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}