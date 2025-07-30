import type {
  ABTestVariant,
  RecommendationAlgorithm,
  HomeFeedSectionType,
} from '@/types';

export class ABTestingManager {
  private activeTests: Map<string, ABTestVariant[]> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.initializeDefaultTests();
  }

  private initializeDefaultTests() {
    // Default A/B tests for recommendation algorithms
    const homeFeedAlgorithmTest: ABTestVariant[] = [
      {
        id: 'home-feed-hybrid-v1',
        name: 'Hybrid Algorithm v1',
        description: 'Original hybrid approach with 40% collaborative, 35% content-based, 25% popularity',
        algorithm: 'hybrid',
        parameters: {
          collaborativeWeight: 0.4,
          contentBasedWeight: 0.35,
          popularityWeight: 0.25,
        },
        trafficPercentage: 50,
        isActive: true,
        metrics: {
          userEngagement: 0,
          clickThroughRate: 0,
          playThroughRate: 0,
          skipRate: 0,
          likeRate: 0,
          sessionLength: 0,
          returnRate: 0,
        },
        startDate: new Date(),
        createdBy: 'system',
      },
      {
        id: 'home-feed-hybrid-v2',
        name: 'Hybrid Algorithm v2',
        description: 'Enhanced hybrid with higher collaborative filtering weight',
        algorithm: 'hybrid',
        parameters: {
          collaborativeWeight: 0.5,
          contentBasedWeight: 0.3,
          popularityWeight: 0.2,
        },
        trafficPercentage: 50,
        isActive: true,
        metrics: {
          userEngagement: 0,
          clickThroughRate: 0,
          playThroughRate: 0,
          skipRate: 0,
          likeRate: 0,
          sessionLength: 0,
          returnRate: 0,
        },
        startDate: new Date(),
        createdBy: 'system',
      },
    ];

    const discoverWeeklyTest: ABTestVariant[] = [
      {
        id: 'discover-weekly-diversity-low',
        name: 'Low Diversity Discover Weekly',
        description: 'Focus on user preferences with low diversity',
        algorithm: 'content_based',
        parameters: {
          diversityLevel: 'low',
          freshnessLevel: 'high',
          personalizedWeight: 0.8,
        },
        trafficPercentage: 33,
        isActive: true,
        metrics: {
          userEngagement: 0,
          clickThroughRate: 0,
          playThroughRate: 0,
          skipRate: 0,
          likeRate: 0,
          sessionLength: 0,
          returnRate: 0,
        },
        startDate: new Date(),
        createdBy: 'system',
      },
      {
        id: 'discover-weekly-diversity-medium',
        name: 'Medium Diversity Discover Weekly',
        description: 'Balanced approach with moderate diversity',
        algorithm: 'hybrid',
        parameters: {
          diversityLevel: 'medium',
          freshnessLevel: 'medium',
          personalizedWeight: 0.7,
        },
        trafficPercentage: 34,
        isActive: true,
        metrics: {
          userEngagement: 0,
          clickThroughRate: 0,
          playThroughRate: 0,
          skipRate: 0,
          likeRate: 0,
          sessionLength: 0,
          returnRate: 0,
        },
        startDate: new Date(),
        createdBy: 'system',
      },
      {
        id: 'discover-weekly-diversity-high',
        name: 'High Diversity Discover Weekly',
        description: 'Exploration-focused with high diversity',
        algorithm: 'collaborative_filtering',
        parameters: {
          diversityLevel: 'high',
          freshnessLevel: 'high',
          personalizedWeight: 0.6,
        },
        trafficPercentage: 33,
        isActive: true,
        metrics: {
          userEngagement: 0,
          clickThroughRate: 0,
          playThroughRate: 0,
          skipRate: 0,
          likeRate: 0,
          sessionLength: 0,
          returnRate: 0,
        },
        startDate: new Date(),
        createdBy: 'system',
      },
    ];

    this.activeTests.set('home-feed-algorithm', homeFeedAlgorithmTest);
    this.activeTests.set('discover-weekly-diversity', discoverWeeklyTest);
  }

  getUserVariant(userId: string, testName: string): ABTestVariant | null {
    // Check if user already has an assignment
    const userAssignments = this.userAssignments.get(userId);
    if (userAssignments?.has(testName)) {
      const variantId = userAssignments.get(testName)!;
      const test = this.activeTests.get(testName);
      return test?.find(variant => variant.id === variantId) || null;
    }

    // Assign user to a variant
    const test = this.activeTests.get(testName);
    if (!test || test.length === 0) return null;

    const activeVariants = test.filter(variant => variant.isActive);
    if (activeVariants.length === 0) return null;

    // Use consistent hashing for user assignment
    const assignedVariant = this.assignUserToVariant(userId, activeVariants);
    
    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(testName, assignedVariant.id);

    return assignedVariant;
  }

  private assignUserToVariant(userId: string, variants: ABTestVariant[]): ABTestVariant {
    // Create a hash from userId for consistent assignment
    const hash = this.simpleHash(userId);
    const hashValue = hash % 100;

    let cumulativePercentage = 0;
    for (const variant of variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (hashValue < cumulativePercentage) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0]!;
  }

  trackEvent(
    userId: string,
    testName: string,
    eventType: 'view' | 'click' | 'play' | 'skip' | 'like' | 'session_end',
    metadata?: Record<string, unknown>
  ) {
    const variant = this.getUserVariant(userId, testName);
    if (!variant) return;

    // Update metrics based on event type
    switch (eventType) {
      case 'view':
        variant.metrics.userEngagement += 1;
        break;
      case 'click':
        variant.metrics.clickThroughRate += 1;
        break;
      case 'play':
        variant.metrics.playThroughRate += 1;
        break;
      case 'skip':
        variant.metrics.skipRate += 1;
        break;
      case 'like':
        variant.metrics.likeRate += 1;
        break;
      case 'session_end':
        if (metadata?.sessionLength && typeof metadata.sessionLength === 'number') {
          variant.metrics.sessionLength += metadata.sessionLength;
        }
        break;
    }

    // In a real implementation, this would send data to analytics service
    console.log(`A/B Test Event: ${testName} - ${variant.name} - ${eventType}`, metadata);
  }

  getAlgorithmForSection(userId: string, sectionType: HomeFeedSectionType): {
    algorithm: RecommendationAlgorithm;
    parameters: Record<string, unknown>;
    variant?: string;
  } {
    // Map section types to test names
    const testMapping: Record<HomeFeedSectionType, string> = {
      'discover_weekly': 'discover-weekly-diversity',
      'daily_mix': 'home-feed-algorithm',
      'because_you_liked': 'home-feed-algorithm',
      'heavy_rotation': 'home-feed-algorithm',
      'recently_played': 'home-feed-algorithm',
      'jump_back_in': 'home-feed-algorithm',
      'trending_now': 'trending-algorithm',
      'new_releases': 'new-releases-algorithm',
      'charts': 'charts-algorithm',
      'morning_mix': 'time-contextual-algorithm',
      'evening_chill': 'time-contextual-algorithm',
      'workout_mix': 'activity-algorithm',
      'focus_music': 'activity-algorithm',
      'friends_listening': 'social-algorithm',
      'popular_in_network': 'social-algorithm',
      'similar_artists': 'content-based-algorithm',
      'genre_based': 'content-based-algorithm',
      'mood_based': 'mood-algorithm',
      'activity_based': 'activity-algorithm',
      'release_radar': 'new-releases-algorithm',
    };

    const testName = testMapping[sectionType];
    if (!testName) {
      return {
        algorithm: 'hybrid',
        parameters: {},
      };
    }

    const variant = this.getUserVariant(userId, testName);
    if (!variant) {
      return {
        algorithm: 'hybrid',
        parameters: {},
      };
    }

    return {
      algorithm: variant.algorithm,
      parameters: variant.parameters,
      variant: variant.id,
    };
  }

  createTest(
    testName: string,
    variants: Omit<ABTestVariant, 'id' | 'startDate' | 'metrics' | 'createdBy'>[]
  ): string {
    const testVariants: ABTestVariant[] = variants.map((variant, index) => ({
      ...variant,
      id: `${testName}-variant-${index + 1}`,
      startDate: new Date(),
      metrics: {
        userEngagement: 0,
        clickThroughRate: 0,
        playThroughRate: 0,
        skipRate: 0,
        likeRate: 0,
        sessionLength: 0,
        returnRate: 0,
      },
      createdBy: 'user',
    }));

    this.activeTests.set(testName, testVariants);
    return testName;
  }

  endTest(testName: string): ABTestResult | null {
    const test = this.activeTests.get(testName);
    if (!test) return null;

    // Calculate results
    const totalEvents = test.reduce((sum, variant) => 
      sum + variant.metrics.userEngagement, 0
    );

    const results: ABTestResult = {
      testName,
      startDate: test[0]?.startDate || new Date(),
      endDate: new Date(),
      totalEvents,
      variants: test.map(variant => ({
        id: variant.id,
        name: variant.name,
        trafficPercentage: variant.trafficPercentage,
        metrics: variant.metrics,
        performance: this.calculatePerformanceScore(variant.metrics),
      })),
      winner: this.determineWinner(test),
      confidence: this.calculateConfidence(test),
    };

    // Mark test as inactive
    test.forEach(variant => {
      variant.isActive = false;
      variant.endDate = new Date();
    });

    return results;
  }

  private calculatePerformanceScore(metrics: ABTestVariant['metrics']): number {
    // Weighted score based on different metrics
    const weights = {
      clickThroughRate: 0.25,
      playThroughRate: 0.3,
      likeRate: 0.2,
      sessionLength: 0.15,
      skipRate: -0.1, // Negative weight for skip rate
    };

    let score = 0;
    const totalEngagement = metrics.userEngagement || 1;

    score += (metrics.clickThroughRate / totalEngagement) * weights.clickThroughRate;
    score += (metrics.playThroughRate / totalEngagement) * weights.playThroughRate;
    score += (metrics.likeRate / totalEngagement) * weights.likeRate;
    score += (metrics.sessionLength / totalEngagement / 1000) * weights.sessionLength; // Normalize session length
    score += (metrics.skipRate / totalEngagement) * weights.skipRate;

    return Math.max(0, score);
  }

  private determineWinner(variants: ABTestVariant[]): string | null {
    if (variants.length === 0) return null;

    let bestVariant = variants[0];
    if (!bestVariant) return null;
    let bestScore = this.calculatePerformanceScore(bestVariant.metrics);

    for (const variant of variants.slice(1)) {
      const score = this.calculatePerformanceScore(variant.metrics);
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    }

    return bestVariant.id;
  }

  private calculateConfidence(variants: ABTestVariant[]): number {
    // Simplified confidence calculation
    // In a real implementation, this would use proper statistical tests
    const totalEvents = variants.reduce((sum, v) => sum + v.metrics.userEngagement, 0);
    
    if (totalEvents < 100) return 0; // Not enough data
    if (totalEvents < 1000) return 0.7;
    if (totalEvents < 10000) return 0.85;
    return 0.95;
  }

  getActiveTests(): Record<string, ABTestVariant[]> {
    const activeTests: Record<string, ABTestVariant[]> = {};
    
    for (const [testName, variants] of this.activeTests.entries()) {
      const activeVariants = variants.filter(v => v.isActive);
      if (activeVariants.length > 0) {
        activeTests[testName] = activeVariants;
      }
    }

    return activeTests;
  }

  getUserTestAssignments(userId: string): Record<string, string> {
    const assignments = this.userAssignments.get(userId);
    return assignments ? Object.fromEntries(assignments.entries()) : {};
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

interface ABTestResult {
  testName: string;
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  variants: {
    id: string;
    name: string;
    trafficPercentage: number;
    metrics: ABTestVariant['metrics'];
    performance: number;
  }[];
  winner: string | null;
  confidence: number;
}

// Singleton instance
export const abTestingManager = new ABTestingManager();