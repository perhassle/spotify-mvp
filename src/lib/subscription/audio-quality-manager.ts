import { User, Track } from '@/types';
import { TierManager } from './tier-manager';

/**
 * Audio quality management system
 * Handles quality selection based on user subscription tier
 */

export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';

export interface QualitySettings {
  bitrate: number;
  sampleRate: number;
  format: 'mp3' | 'aac' | 'flac';
  description: string;
  displayName: string;
  fileSize: number; // MB per minute
}

// Quality configurations
export const QUALITY_SETTINGS: Record<AudioQuality, QualitySettings> = {
  low: {
    bitrate: 96,
    sampleRate: 44100,
    format: 'mp3',
    description: 'Good for saving data',
    displayName: 'Low (96 kbps)',
    fileSize: 0.7
  },
  medium: {
    bitrate: 160,
    sampleRate: 44100,
    format: 'aac',
    description: 'Balanced quality and data usage',
    displayName: 'Medium (160 kbps)',
    fileSize: 1.2
  },
  high: {
    bitrate: 320,
    sampleRate: 44100,
    format: 'aac',
    description: 'High quality audio',
    displayName: 'High (320 kbps)',
    fileSize: 2.4
  },
  lossless: {
    bitrate: 1411,
    sampleRate: 44100,
    format: 'flac',
    description: 'Studio quality, requires Premium',
    displayName: 'Lossless (1411 kbps)',
    fileSize: 10.6
  }
};

// Tier-based quality access
export const TIER_QUALITY_ACCESS = {
  free: ['low'] as AudioQuality[],
  premium: ['low', 'medium', 'high', 'lossless'] as AudioQuality[],
  student: ['low', 'medium', 'high', 'lossless'] as AudioQuality[],
  family: ['low', 'medium', 'high', 'lossless'] as AudioQuality[]
};

interface QualityPreferences {
  userId: string;
  preferredQuality: AudioQuality;
  adaptiveQuality: boolean; // Automatically adjust based on connection
  dataUsageLimit?: number; // MB per month
  currentDataUsage: number;
  wifiOnlyHighQuality: boolean;
}

class AudioQualityManagerService {
  private userPreferences: Map<string, QualityPreferences> = new Map();
  private networkQuality: 'poor' | 'good' | 'excellent' = 'good';

  /**
   * Initialize quality preferences for user
   */
  private initializePreferences(userId: string, user: User): QualityPreferences {
    const defaultQuality = TierManager.getTierLimits(user.subscriptionTier).audioQuality;
    
    const preferences: QualityPreferences = {
      userId,
      preferredQuality: defaultQuality,
      adaptiveQuality: true,
      currentDataUsage: 0,
      wifiOnlyHighQuality: false
    };

    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  /**
   * Get allowed quality options for user's tier
   */
  public getAllowedQualities(user: User | null): AudioQuality[] {
    if (!user) return ['low'];
    return TIER_QUALITY_ACCESS[user.subscriptionTier] || ['low'];
  }

  /**
   * Get maximum quality for user's tier
   */
  public getMaxQualityForTier(user: User | null): AudioQuality {
    const allowedQualities = this.getAllowedQualities(user);
    return allowedQualities[allowedQualities.length - 1] || 'low';
  }

  /**
   * Get optimal quality for track playback
   */
  public getOptimalQuality(user: User | null, _track: Track): {
    quality: AudioQuality;
    reason: string;
    isDowngraded: boolean;
  } {
    if (!user) {
      return {
        quality: 'low',
        reason: 'Not signed in',
        isDowngraded: false
      };
    }

    let preferences = this.userPreferences.get(user.id);
    if (!preferences) {
      preferences = this.initializePreferences(user.id, user);
    }

    const allowedQualities = this.getAllowedQualities(user);
    const maxQuality = this.getMaxQualityForTier(user);

    // Start with user's preferred quality
    let optimalQuality = preferences.preferredQuality;
    let reason = 'User preference';
    let isDowngraded = false;

    // Check if preferred quality is allowed for user's tier
    if (!allowedQualities.includes(optimalQuality)) {
      optimalQuality = maxQuality;
      reason = 'Limited by subscription tier';
      isDowngraded = true;
    }

    // Apply adaptive quality adjustments
    if (preferences.adaptiveQuality) {
      const adaptedQuality = this.getAdaptiveQuality(optimalQuality, preferences);
      if (adaptedQuality.quality !== optimalQuality) {
        optimalQuality = adaptedQuality.quality;
        reason = adaptedQuality.reason;
        isDowngraded = true;
      }
    }

    return {
      quality: optimalQuality,
      reason,
      isDowngraded
    };
  }

  /**
   * Get adaptive quality based on network and data usage
   */
  private getAdaptiveQuality(preferredQuality: AudioQuality, preferences: QualityPreferences): {
    quality: AudioQuality;
    reason: string;
  } {
    // Check network conditions
    if (this.networkQuality === 'poor') {
      if (preferredQuality === 'high' || preferredQuality === 'lossless') {
        return {
          quality: 'medium',
          reason: 'Poor network connection'
        };
      }
    }

    // Check data usage limits
    if (preferences.dataUsageLimit && preferences.currentDataUsage > preferences.dataUsageLimit * 0.9) {
      if (preferredQuality === 'high' || preferredQuality === 'lossless') {
        return {
          quality: 'medium',
          reason: 'Approaching data limit'
        };
      }
    }

    // Check WiFi-only high quality setting
    if (preferences.wifiOnlyHighQuality && !this.isOnWiFi()) {
      if (preferredQuality === 'high' || preferredQuality === 'lossless') {
        return {
          quality: 'medium',
          reason: 'High quality limited to WiFi'
        };
      }
    }

    return {
      quality: preferredQuality,
      reason: 'No adjustments needed'
    };
  }

  /**
   * Set user's quality preference
   */
  public setQualityPreference(user: User, quality: AudioQuality): boolean {
    const allowedQualities = this.getAllowedQualities(user);
    
    if (!allowedQualities.includes(quality)) {
      return false; // Quality not allowed for user's tier
    }

    let preferences = this.userPreferences.get(user.id);
    if (!preferences) {
      preferences = this.initializePreferences(user.id, user);
    }

    preferences.preferredQuality = quality;
    this.emitQualityChange(user.id, quality);
    
    return true;
  }

  /**
   * Get quality settings for display
   */
  public getQualitySettings(quality: AudioQuality): QualitySettings {
    return QUALITY_SETTINGS[quality];
  }

  /**
   * Get quality comparison for upgrade prompts
   */
  public getQualityComparison(currentTier: string, targetTier: string): {
    current: AudioQuality[];
    target: AudioQuality[];
    improvements: string[];
  } {
    const currentQualities = TIER_QUALITY_ACCESS[currentTier as keyof typeof TIER_QUALITY_ACCESS] || ['low'];
    const targetQualities = TIER_QUALITY_ACCESS[targetTier as keyof typeof TIER_QUALITY_ACCESS] || ['low'];
    
    const improvements: string[] = [];
    
    if (targetQualities.includes('high') && !currentQualities.includes('high')) {
      improvements.push('High quality 320kbps streaming');
    }
    
    if (targetQualities.includes('lossless') && !currentQualities.includes('lossless')) {
      improvements.push('Lossless audio quality');
    }

    return {
      current: currentQualities,
      target: targetQualities,
      improvements
    };
  }

  /**
   * Calculate data usage for a track
   */
  public calculateDataUsage(track: Track, quality: AudioQuality): number {
    const settings = QUALITY_SETTINGS[quality];
    const durationMinutes = track.duration / 60;
    return settings.fileSize * durationMinutes;
  }

  /**
   * Track data usage
   */
  public trackDataUsage(userId: string, quality: AudioQuality, durationSeconds: number): void {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return;

    const durationMinutes = durationSeconds / 60;
    const dataUsed = QUALITY_SETTINGS[quality].fileSize * durationMinutes;
    
    preferences.currentDataUsage += dataUsed;
  }

  /**
   * Get current data usage
   */
  public getDataUsage(userId: string): {
    current: number;
    limit?: number;
    percentage: number;
  } {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) {
      return { current: 0, percentage: 0 };
    }

    const percentage = preferences.dataUsageLimit 
      ? (preferences.currentDataUsage / preferences.dataUsageLimit) * 100
      : 0;

    return {
      current: preferences.currentDataUsage,
      limit: preferences.dataUsageLimit,
      percentage: Math.min(100, percentage)
    };
  }

  /**
   * Reset monthly data usage
   */
  public resetDataUsage(userId: string): void {
    const preferences = this.userPreferences.get(userId);
    if (preferences) {
      preferences.currentDataUsage = 0;
    }
  }

  /**
   * Update network quality
   */
  public updateNetworkQuality(quality: 'poor' | 'good' | 'excellent'): void {
    this.networkQuality = quality;
  }

  /**
   * Check if device is on WiFi (mock implementation)
   */
  private isOnWiFi(): boolean {
    // In a real app, this would check the actual network connection
    // For now, we'll mock it based on network quality
    return this.networkQuality === 'excellent';
  }

  /**
   * Get quality recommendation based on user behavior
   */
  public getQualityRecommendation(user: User): {
    recommended: AudioQuality;
    reason: string;
  } {
    const allowedQualities = this.getAllowedQualities(user);
    const maxQuality = this.getMaxQualityForTier(user);

    // For free users, recommend staying on low to save data
    if (user.subscriptionTier === 'free') {
      return {
        recommended: 'low',
        reason: 'Saves data usage on free plan'
      };
    }

    // For premium users, recommend high quality
    if (allowedQualities.includes('high')) {
      return {
        recommended: 'high',
        reason: 'Best balance of quality and data usage'
      };
    }

    return {
      recommended: maxQuality,
      reason: 'Highest quality available for your plan'
    };
  }

  /**
   * Update quality preferences
   */
  public updatePreferences(userId: string, updates: Partial<QualityPreferences>): void {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return;

    Object.assign(preferences, updates);
  }

  /**
   * Get user preferences
   */
  public getPreferences(userId: string): QualityPreferences | null {
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Clean up user preferences
   */
  public cleanup(userId: string): void {
    this.userPreferences.delete(userId);
  }

  /**
   * Emit quality change event
   */
  private emitQualityChange(userId: string, quality: AudioQuality): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qualityChange', {
        detail: {
          userId,
          quality,
          settings: QUALITY_SETTINGS[quality]
        }
      }));
    }
  }
}

// Export singleton instance
export const audioQualityManager = new AudioQualityManagerService();

// Export utility functions
export const QualityUtils = {
  /**
   * Format quality for display
   */
  formatQuality(quality: AudioQuality): string {
    return QUALITY_SETTINGS[quality].displayName;
  },

  /**
   * Get quality badge color
   */
  getQualityBadgeColor(quality: AudioQuality): string {
    switch (quality) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'lossless':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Compare qualities
   */
  compareQualities(quality1: AudioQuality, quality2: AudioQuality): number {
    const qualities: AudioQuality[] = ['low', 'medium', 'high', 'lossless'];
    return qualities.indexOf(quality2) - qualities.indexOf(quality1);
  },

  /**
   * Format data usage
   */
  formatDataUsage(mb: number): string {
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
  },

  /**
   * Get upgrade benefit message
   */
  getUpgradeBenefit(currentQuality: AudioQuality, targetQuality: AudioQuality): string {
    const current = QUALITY_SETTINGS[currentQuality];
    const target = QUALITY_SETTINGS[targetQuality];
    
    const improvementRatio = target.bitrate / current.bitrate;
    
    if (improvementRatio > 3) {
      return `${improvementRatio.toFixed(0)}x better audio quality`;
    } else if (improvementRatio > 1.5) {
      return `${(improvementRatio * 100 - 100).toFixed(0)}% better audio quality`;
    } else {
      return 'Enhanced audio quality';
    }
  }
};