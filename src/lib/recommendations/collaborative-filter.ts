import type {
  RecommendationRequest,
  RecommendationScore,
  UserProfile,
  RecommendationContext,
  SimilarityMatrix,
  UserBehavior,
} from '@/types';

export class CollaborativeFilter {
  private userSimilarities: Map<string, SimilarityMatrix> = new Map();
  private userItemMatrix: Map<string, Map<string, number>> = new Map();

  async recommend(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const similarUsers = await this.findSimilarUsers(request.userId);
    const recommendations = new Map<string, number>();

    // Get tracks that similar users have liked but current user hasn't
    for (const [userId, similarity] of Object.entries(similarUsers)) {
      const userItems = this.userItemMatrix.get(userId);
      if (!userItems) continue;

      for (const [trackId, rating] of userItems.entries()) {
        // Skip if user has already interacted with this track
        if (request.excludeTrackIds?.includes(trackId)) continue;
        
        // Skip if current user has already rated this track
        const currentUserItems = this.userItemMatrix.get(request.userId);
        if (currentUserItems?.has(trackId)) continue;

        // Weight the rating by user similarity
        const weightedRating = rating * similarity;
        recommendations.set(trackId, (recommendations.get(trackId) || 0) + weightedRating);
      }
    }

    // Convert to RecommendationScore format
    return Array.from(recommendations.entries())
      .map(([trackId, score]) => ({
        trackId,
        score: Math.min(score, 1.0), // Normalize to 0-1
        reasons: [{
          type: 'collaborative' as const,
          weight: 1.0,
          explanation: 'Users with similar taste also liked this',
          metadata: { algorithm: 'collaborative_filtering' },
        }],
        algorithm: 'collaborative_filtering' as const,
        context,
        freshness: 0.5, // Neutral freshness for collaborative recommendations
        diversity: 0.6, // Generally good diversity from collaborative filtering
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit);
  }

  private async findSimilarUsers(userId: string): Promise<Record<string, number>> {
    const similarities = this.userSimilarities.get(userId);
    if (!similarities) {
      // Generate similarities on the fly if not cached
      return this.generateUserSimilarities(userId);
    }

    // Return top 20 most similar users
    return Object.fromEntries(
      Object.entries(similarities.similarities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
    );
  }

  private generateUserSimilarities(userId: string): Record<string, number> {
    const currentUserItems = this.userItemMatrix.get(userId);
    if (!currentUserItems) return {};

    const similarities: Record<string, number> = {};

    // Calculate cosine similarity with other users
    for (const [otherUserId, otherUserItems] of this.userItemMatrix.entries()) {
      if (otherUserId === userId) continue;

      const similarity = this.calculateCosineSimilarity(currentUserItems, otherUserItems);
      if (similarity > 0.1) { // Only keep meaningful similarities
        similarities[otherUserId] = similarity;
      }
    }

    // Cache the similarities
    this.userSimilarities.set(userId, {
      userId,
      similarities,
      lastUpdated: new Date(),
    });

    return similarities;
  }

  private calculateCosineSimilarity(
    items1: Map<string, number>,
    items2: Map<string, number>
  ): number {
    const commonItems = new Set([...items1.keys()].filter(item => items2.has(item)));
    if (commonItems.size === 0) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const item of commonItems) {
      const rating1 = items1.get(item)!;
      const rating2 = items2.get(item)!;
      
      dotProduct += rating1 * rating2;
      magnitude1 += rating1 * rating1;
      magnitude2 += rating2 * rating2;
    }

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  private calculateJaccardSimilarity(
    items1: Map<string, number>,
    items2: Map<string, number>
  ): number {
    const set1 = new Set(items1.keys());
    const set2 = new Set(items2.keys());
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  async updateUserItem(userId: string, trackId: string, rating: number): Promise<void> {
    if (!this.userItemMatrix.has(userId)) {
      this.userItemMatrix.set(userId, new Map());
    }
    
    const userItems = this.userItemMatrix.get(userId)!;
    userItems.set(trackId, rating);

    // Invalidate cached similarities for this user
    this.userSimilarities.delete(userId);
  }

  async trainModel(): Promise<void> {
    // Initialize with mock data for demonstration
    this.initializeMockData();
    
    // In a real implementation, this would:
    // 1. Load user-item interactions from database
    // 2. Calculate user similarities
    // 3. Optionally use matrix factorization techniques
    // 4. Store computed similarities for fast lookup
    
    console.log('Collaborative filtering model trained with mock data');
  }

  private initializeMockData(): void {
    // Generate mock user-item matrix
    const numUsers = 1000;
    const numTracks = 500;
    
    for (let userId = 1; userId <= numUsers; userId++) {
      const userIdStr = `user-${userId}`;
      const userItems = new Map<string, number>();
      
      // Each user rates 20-100 random tracks
      const numRatings = 20 + Math.floor(Math.random() * 80);
      const ratedTracks = new Set<number>();
      
      for (let i = 0; i < numRatings; i++) {
        let trackNum;
        do {
          trackNum = 1 + Math.floor(Math.random() * numTracks);
        } while (ratedTracks.has(trackNum));
        
        ratedTracks.add(trackNum);
        const trackId = `track-${trackNum}`;
        
        // Generate rating based on user preferences (some users prefer certain tracks)
        const baseRating = 0.3 + Math.random() * 0.7;
        const userBias = (userId % 10) / 10; // Some systematic user preferences
        const trackBias = (trackNum % 7) / 7; // Some tracks are generally more liked
        
        const rating = Math.min(1.0, baseRating + (userBias * trackBias * 0.3));
        userItems.set(trackId, rating);
      }
      
      this.userItemMatrix.set(userIdStr, userItems);
    }

    // Pre-calculate some user similarities for better performance
    const sampleUsers = Array.from(this.userItemMatrix.keys()).slice(0, 100);
    sampleUsers.forEach(userId => {
      this.generateUserSimilarities(userId);
    });
  }

  // Methods for handling implicit feedback (play counts, skips, etc.)
  convertBehaviorToRating(behaviors: UserBehavior[]): number {
    let rating = 0;
    let totalWeight = 0;

    behaviors.forEach(behavior => {
      let weight = 0;
      let value = 0;

      switch (behavior.action) {
        case 'play':
          weight = 1.0;
          value = Math.min(1.0, (behavior.listenDuration || 0) / 30); // Normalize by 30 seconds
          break;
        case 'like':
          weight = 2.0;
          value = 1.0;
          break;
        case 'skip':
          weight = 0.5;
          value = -0.5; // Negative rating for skips
          break;
        case 'add_to_playlist':
          weight = 1.5;
          value = 1.0;
          break;
        case 'share':
          weight = 2.0;
          value = 1.0;
          break;
      }

      rating += weight * value;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.max(-1, Math.min(1, rating / totalWeight)) : 0;
  }

  // Item-based collaborative filtering
  async getItemBasedRecommendations(
    request: RecommendationRequest,
    userProfile: UserProfile,
    context: RecommendationContext
  ): Promise<RecommendationScore[]> {
    const userItems = this.userItemMatrix.get(request.userId);
    if (!userItems) return [];

    const recommendations = new Map<string, number>();

    // For each item the user has rated highly
    for (const [trackId, rating] of userItems.entries()) {
      if (rating < 0.6) continue; // Only consider well-liked items

      // Find similar items
      const similarItems = await this.findSimilarItems(trackId);
      
      for (const [similarTrackId, similarity] of Object.entries(similarItems)) {
        if (request.excludeTrackIds?.includes(similarTrackId)) continue;
        if (userItems.has(similarTrackId)) continue; // User already rated this

        const score = rating * similarity;
        recommendations.set(similarTrackId, (recommendations.get(similarTrackId) || 0) + score);
      }
    }

    return Array.from(recommendations.entries())
      .map(([trackId, score]) => ({
        trackId,
        score: Math.min(score, 1.0),
        reasons: [{
          type: 'collaborative' as const,
          weight: 1.0,
          explanation: 'Similar to tracks you\'ve liked',
          metadata: { algorithm: 'item_based_collaborative' },
        }],
        algorithm: 'collaborative_filtering' as const,
        context,
        freshness: 0.5,
        diversity: 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit);
  }

  private async findSimilarItems(trackId: string): Promise<Record<string, number>> {
    // In a real implementation, this would use pre-computed item similarities
    // For now, return mock similarities
    const similarities: Record<string, number> = {};
    
    for (let i = 1; i <= 50; i++) {
      const similarTrackId = `track-${i}`;
      if (similarTrackId !== trackId) {
        similarities[similarTrackId] = Math.random();
      }
    }

    return similarities;
  }
}