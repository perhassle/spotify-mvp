import type {
  TrendingData,
  PopularityData,
} from '@/types';

export class TrendingAnalyzer {
  private trendingData: Map<string, TrendingData> = new Map();
  private popularityData: Map<string, PopularityData> = new Map();
  private playCountHistory: Map<string, { timestamp: Date; count: number }[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  async updateTrendingData(): Promise<void> {
    // Simulate updating trending data
    const trackIds = Array.from(this.popularityData.keys());
    
    for (const trackId of trackIds) {
      const currentData = this.trendingData.get(trackId);
      const popularityData = this.popularityData.get(trackId);
      
      if (!popularityData) continue;

      // Calculate velocity (rate of change in play count)
      const velocity = this.calculateVelocity(trackId);
      
      // Determine if track is trending
      const isTrending = velocity > 1.5 && popularityData.playCount > 1000;
      
      const trendingData: TrendingData = {
        trackId,
        playCount: popularityData.playCount,
        playCountChange: velocity,
        velocity,
        regions: ['US', 'UK', 'CA'], // Mock regions
        ageGroups: ['18-24', '25-34'], // Mock age groups
        timeFrame: '1d',
        trending: isTrending,
        trendingRank: isTrending ? this.calculateTrendingRank(trackId, velocity) : undefined,
        peakRank: currentData?.peakRank || (isTrending ? this.calculateTrendingRank(trackId, velocity) : undefined),
        lastUpdated: new Date(),
      };

      this.trendingData.set(trackId, trendingData);
    }

    console.log('Trending data updated');
  }

  async getPopularityData(): Promise<PopularityData[]> {
    return Array.from(this.popularityData.values());
  }

  async getTrendingData(): Promise<TrendingData[]> {
    return Array.from(this.trendingData.values())
      .filter(data => data.trending)
      .sort((a, b) => b.velocity - a.velocity);
  }

  async getPopularTracks(limit = 50): Promise<PopularityData[]> {
    return Array.from(this.popularityData.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  async getTrendingTracks(limit = 50): Promise<TrendingData[]> {
    return Array.from(this.trendingData.values())
      .filter(data => data.trending)
      .sort((a, b) => (b.trendingRank || 0) - (a.trendingRank || 0))
      .slice(0, limit);
  }

  async getGenrePopularity(genre: string): Promise<PopularityData[]> {
    // Mock implementation - in real app would filter by genre
    return Array.from(this.popularityData.values())
      .filter(data => this.getTrackGenres(data.trackId).includes(genre))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 20);
  }

  async getRegionalTrending(region: string): Promise<TrendingData[]> {
    return Array.from(this.trendingData.values())
      .filter(data => data.regions.includes(region))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 30);
  }

  trackPlay(trackId: string, userId: string, listenDuration: number): void {
    // Update play count
    const currentPopularity = this.popularityData.get(trackId);
    if (currentPopularity) {
      currentPopularity.playCount++;
      currentPopularity.uniqueListeners++; // Simplified - should track unique users
      currentPopularity.lastUpdated = new Date();

      // Update completion rate based on listen duration
      const trackDuration = 180; // Mock 3-minute track
      const completionRate = Math.min(listenDuration / trackDuration, 1);
      currentPopularity.completionRate = 
        (currentPopularity.completionRate * 0.95) + (completionRate * 0.05);
    }

    // Track play count history for velocity calculation
    if (!this.playCountHistory.has(trackId)) {
      this.playCountHistory.set(trackId, []);
    }
    
    const history = this.playCountHistory.get(trackId)!;
    history.push({ timestamp: new Date(), count: 1 });
    
    // Keep only last 30 days of history
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(entry => entry.timestamp > thirtyDaysAgo);
    this.playCountHistory.set(trackId, filteredHistory);
  }

  trackSkip(trackId: string, _userId: string, _skipPoint: number): void {
    const currentPopularity = this.popularityData.get(trackId);
    if (currentPopularity) {
      // Update skip rate
      const totalInteractions = currentPopularity.playCount + 1; // +1 for this skip
      const skipCount = Math.floor(currentPopularity.skipRate * currentPopularity.playCount) + 1;
      currentPopularity.skipRate = skipCount / totalInteractions;
      currentPopularity.lastUpdated = new Date();
    }
  }

  trackShare(trackId: string, _userId: string): void {
    const currentPopularity = this.popularityData.get(trackId);
    if (currentPopularity) {
      currentPopularity.shareCount++;
      currentPopularity.lastUpdated = new Date();
    }
  }

  trackPlaylistAddition(trackId: string, _userId: string): void {
    const currentPopularity = this.popularityData.get(trackId);
    if (currentPopularity) {
      currentPopularity.playlistAdditions++;
      currentPopularity.lastUpdated = new Date();
    }
  }

  calculatePopularityScore(trackId: string): number {
    const popularity = this.popularityData.get(trackId);
    if (!popularity) return 0;

    // Weighted combination of different popularity metrics
    let score = 0;
    
    // Play count (40% weight)
    const normalizedPlayCount = Math.min(popularity.playCount / 1000000, 1); // Normalize to millions
    score += normalizedPlayCount * 0.4;
    
    // Completion rate (25% weight)
    score += popularity.completionRate * 0.25;
    
    // Low skip rate bonus (20% weight)
    score += (1 - popularity.skipRate) * 0.2;
    
    // Share count (10% weight)
    const normalizedShareCount = Math.min(popularity.shareCount / 10000, 1);
    score += normalizedShareCount * 0.1;
    
    // Playlist additions (5% weight)
    const normalizedPlaylistAdditions = Math.min(popularity.playlistAdditions / 50000, 1);
    score += normalizedPlaylistAdditions * 0.05;

    return Math.min(score, 1.0);
  }

  calculateTrendingScore(trackId: string): number {
    const trending = this.trendingData.get(trackId);
    if (!trending || !trending.trending) return 0;

    // Velocity is the primary factor for trending
    let score = Math.min(trending.velocity / 10, 1); // Normalize velocity
    
    // Boost for multiple regions
    if (trending.regions.length > 1) {
      score *= 1.2;
    }
    
    // Boost for multiple age groups
    if (trending.ageGroups.length > 1) {
      score *= 1.1;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateVelocity(trackId: string): number {
    const history = this.playCountHistory.get(trackId);
    if (!history || history.length < 2) return 0;

    // Calculate velocity over last 24 hours vs previous 24 hours
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const recentPlays = history.filter(entry => entry.timestamp > oneDayAgo).length;
    const previousPlays = history.filter(entry => 
      entry.timestamp > twoDaysAgo && entry.timestamp <= oneDayAgo
    ).length;

    if (previousPlays === 0) return recentPlays > 0 ? 10 : 0; // High velocity if no previous data
    
    return recentPlays / previousPlays;
  }

  private calculateTrendingRank(trackId: string, _velocity: number): number {
    // Get all trending tracks and rank by velocity
    const allTrending = Array.from(this.trendingData.values())
      .filter(data => data.trending)
      .sort((a, b) => b.velocity - a.velocity);

    const index = allTrending.findIndex(data => data.trackId === trackId);
    return index + 1;
  }

  private initializeMockData(): void {
    // Initialize mock popularity data
    for (let i = 1; i <= 500; i++) {
      const trackId = `track-${i}`;
      
      // Generate realistic popularity data with some variance
      const basePopularity = Math.random();
      const playCount = Math.floor(basePopularity * 10000000); // Up to 10M plays
      const skipRate = 0.1 + Math.random() * 0.3; // 10-40% skip rate
      const completionRate = 0.6 + Math.random() * 0.4; // 60-100% completion rate
      
      const popularityData: PopularityData = {
        trackId,
        globalRank: i,
        regionRanks: {
          'US': i + Math.floor(Math.random() * 100) - 50,
          'UK': i + Math.floor(Math.random() * 100) - 50,
          'CA': i + Math.floor(Math.random() * 100) - 50,
        },
        genreRanks: {
          'Pop': Math.floor(Math.random() * 100) + 1,
          'Rock': Math.floor(Math.random() * 100) + 1,
        },
        playCount,
        uniqueListeners: Math.floor(playCount * 0.3), // Rough estimate
        shareCount: Math.floor(playCount * 0.001), // 0.1% share rate
        playlistAdditions: Math.floor(playCount * 0.01), // 1% playlist addition rate
        skipRate,
        completionRate,
        lastUpdated: new Date(),
      };

      this.popularityData.set(trackId, popularityData);

      // Generate some play history for velocity calculation
      const historyLength = Math.floor(Math.random() * 100) + 10;
      const history: { timestamp: Date; count: number }[] = [];
      
      for (let j = 0; j < historyLength; j++) {
        const daysAgo = Math.random() * 30;
        const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        history.push({ timestamp, count: 1 });
      }
      
      this.playCountHistory.set(trackId, history);
    }

    // Generate initial trending data
    this.updateTrendingData();
  }

  private getTrackGenres(trackId: string): string[] {
    // Mock implementation - in real app would fetch from database
    const genres = ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Indie', 'Jazz', 'Classical', 'Country', 'R&B'];
    const hash = this.simpleHash(trackId);
    const count = (hash % 3) + 1;
    const trackGenres: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const genreIndex = (hash + i * 7) % genres.length;
      const genre = genres[genreIndex];
      if (genre && !trackGenres.includes(genre)) {
        trackGenres.push(genre);
      }
    }
    
    return trackGenres;
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