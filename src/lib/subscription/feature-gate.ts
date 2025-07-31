import { User, SubscriptionTier, PremiumFeature } from '@/types';
import { TierManager } from './tier-manager';
import { skipTracker } from './skip-tracker';
import { audioQualityManager } from './audio-quality-manager';

/**
 * Feature gating system for premium features
 * Controls access to features based on user subscription tier
 */

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  upgradePrompt?: {
    title: string;
    description: string;
    ctaText: string;
    targetTier: SubscriptionTier;
  };
  fallbackAction?: 'disable' | 'downgrade' | 'prompt';
}

export interface FeatureUsageLimit {
  featureId: string;
  limit: number;
  period: 'hour' | 'day' | 'month';
  currentUsage: number;
  resetTime: Date;
}

interface FeatureUsageTracker {
  userId: string;
  featureUsage: Map<string, FeatureUsageLimit>;
  lastUpdate: Date;
}

class FeatureGateService {
  private usageTrackers: Map<string, FeatureUsageTracker> = new Map();
  private featureCallbacks: Map<string, ((userId: string, featureId: string, hasAccess: boolean) => void)[]> = new Map();

  /**
   * Check if user has access to a feature
   */
  public checkFeatureAccess(user: User | null, featureId: string): FeatureAccessResult {
    if (!user) {
      return {
        allowed: false,
        reason: 'Authentication required',
        upgradePrompt: {
          title: 'Sign In Required',
          description: 'Sign in to access this feature',
          ctaText: 'Sign In',
          targetTier: 'free'
        }
      };
    }

    // Check if feature exists and is available for user's tier
    const hasAccess = TierManager.hasFeatureAccess(user, featureId);
    
    if (hasAccess) {
      // Check usage limits for the feature
      const usageCheck = this.checkUsageLimit(user, featureId);
      if (!usageCheck.allowed) {
        return usageCheck;
      }

      return { allowed: true };
    }

    // Feature not available, provide upgrade prompt
    const upgradePrompt = TierManager.getUpgradePrompt(featureId);
    const suggestedTier = TierManager.getSuggestedUpgrade(user) || 'premium';

    return {
      allowed: false,
      reason: `Feature requires ${suggestedTier} subscription`,
      upgradePrompt: upgradePrompt ? {
        title: upgradePrompt.upgradePrompt?.title || 'Premium Feature',
        description: upgradePrompt.upgradePrompt?.description || 'This feature requires a premium subscription',
        ctaText: upgradePrompt.upgradePrompt?.ctaText || 'Upgrade Now',
        targetTier: suggestedTier
      } : undefined,
      fallbackAction: upgradePrompt?.fallbackBehavior
    };
  }

  /**
   * Check usage limits for a feature
   */
  private checkUsageLimit(user: User, featureId: string): FeatureAccessResult {
    // Skip limit checking - handled by skip tracker
    if (featureId === 'unlimited_skips') {
      const skipStatus = skipTracker.getSkipStatus(user);
      if (!skipStatus.canSkip && !skipStatus.isUnlimited) {
        return {
          allowed: false,
          reason: 'Skip limit reached',
          upgradePrompt: {
            title: 'Skip Limit Reached',
            description: `You've used all ${TierManager.getTierLimits(user.subscriptionTier).skipsPerHour} skips for this hour. Upgrade for unlimited skips.`,
            ctaText: 'Get Unlimited Skips',
            targetTier: 'premium'
          }
        };
      }
    }

    // Other usage limits can be added here
    return { allowed: true };
  }

  /**
   * Attempt to use a premium feature
   */
  public async useFeature(user: User | null, featureId: string, ...args: any[]): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    upgradePrompt?: any;
  }> {
    const accessCheck = this.checkFeatureAccess(user, featureId);
    
    if (!accessCheck.allowed) {
      return {
        success: false,
        error: accessCheck.reason,
        upgradePrompt: accessCheck.upgradePrompt
      };
    }

    try {
      // Execute the feature-specific logic
      const result = await this.executeFeature(user!, featureId, ...args);
      
      // Track usage
      this.trackFeatureUsage(user!, featureId);
      
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Feature execution failed'
      };
    }
  }

  /**
   * Execute feature-specific logic
   */
  private async executeFeature(user: User, featureId: string, ...args: any[]): Promise<any> {
    switch (featureId) {
      case 'unlimited_skips':
        return this.handleSkip(user);
        
      case 'high_quality_audio':
        return this.handleQualityChange(user, args[0] || 'high');
        
      case 'offline_downloads':
        return this.handleOfflineDownload(user, args[0]);
        
      case 'equalizer_access':
        return this.handleEqualizerAccess(user, args[0]);
        
      case 'crossfade':
        return this.handleCrossfade(user, args[0]);
        
      case 'custom_playlist_artwork':
        return this.handleCustomArtwork(user, args[0], args[1]);
        
      case 'advanced_visualizer':
        return this.handleAdvancedVisualizer(user, args[0]);
        
      default:
        throw new Error(`Unknown feature: ${featureId}`);
    }
  }

  /**
   * Handle skip functionality
   */
  private handleSkip(user: User): boolean {
    const skipResult = skipTracker.attemptSkip(user);
    return skipResult.success;
  }

  /**
   * Handle audio quality change
   */
  private handleQualityChange(user: User, quality: string): boolean {
    return audioQualityManager.setQualityPreference(user, quality as any);
  }

  /**
   * Handle offline download (mock implementation)
   */
  private async handleOfflineDownload(_user: User, _trackId: string): Promise<{
    downloadId: string;
    estimatedSize: number;
    quality: string;
  }> {
    // Mock implementation - in real app, this would start actual download
    return {
      downloadId: `download_${Date.now()}`,
      estimatedSize: 5.2, // MB
      quality: 'high'
    };
  }

  /**
   * Handle equalizer access
   */
  private handleEqualizerAccess(_user: User, _settings: any): boolean {
    // Mock implementation - in real app, this would apply EQ settings
    return true;
  }

  /**
   * Handle crossfade functionality
   */
  private handleCrossfade(_user: User, _duration: number): boolean {
    // Mock implementation - in real app, this would set crossfade duration
    return true;
  }

  /**
   * Handle custom playlist artwork
   */
  private async handleCustomArtwork(user: User, playlistId: string, imageFile: File): Promise<{
    uploadId: string;
    imageUrl: string;
  }> {
    // Mock implementation - in real app, this would upload and process image
    return {
      uploadId: `upload_${Date.now()}`,
      imageUrl: URL.createObjectURL(imageFile)
    };
  }

  /**
   * Handle advanced visualizer
   */
  private handleAdvancedVisualizer(_user: User, _enabled: boolean): boolean {
    // Mock implementation - in real app, this would toggle advanced visualizer
    return true;
  }

  /**
   * Track feature usage
   */
  private trackFeatureUsage(user: User, featureId: string): void {
    let tracker = this.usageTrackers.get(user.id);
    if (!tracker) {
      tracker = {
        userId: user.id,
        featureUsage: new Map(),
        lastUpdate: new Date()
      };
      this.usageTrackers.set(user.id, tracker);
    }

    const usage = tracker.featureUsage.get(featureId);
    if (usage) {
      usage.currentUsage++;
      tracker.lastUpdate = new Date();
    } else {
      // Initialize usage tracking for this feature
      const now = new Date();
      tracker.featureUsage.set(featureId, {
        featureId,
        limit: this.getFeatureLimit(featureId, user.subscriptionTier),
        period: 'day', // Default period
        currentUsage: 1,
        resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    tracker.lastUpdate = new Date();
  }

  /**
   * Get feature usage limit for tier
   */
  private getFeatureLimit(featureId: string, tier: SubscriptionTier): number {
    // Define feature-specific limits
    const limits: Record<string, Record<SubscriptionTier, number>> = {
      'offline_downloads': {
        free: 0,
        premium: 10000,
        student: 10000,
        family: 10000
      },
      'custom_playlist_artwork': {
        free: 0,
        premium: 100,
        student: 100,
        family: 100
      }
      // Add more feature limits as needed
    };

    return limits[featureId]?.[tier] || Infinity;
  }

  /**
   * Register callback for feature access changes
   */
  public onFeatureAccessChange(featureId: string, callback: (userId: string, featureId: string, hasAccess: boolean) => void): void {
    if (!this.featureCallbacks.has(featureId)) {
      this.featureCallbacks.set(featureId, []);
    }
    this.featureCallbacks.get(featureId)!.push(callback);
  }

  /**
   * Emit feature access change event
   */
  private emitFeatureAccessChange(userId: string, featureId: string, hasAccess: boolean): void {
    const callbacks = this.featureCallbacks.get(featureId);
    if (callbacks) {
      callbacks.forEach(callback => callback(userId, featureId, hasAccess));
    }

    // Also emit as DOM event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('featureAccessChange', {
        detail: { userId, featureId, hasAccess }
      }));
    }
  }

  /**
   * Update user tier and refresh feature access
   */
  public updateUserTier(user: User, oldTier: SubscriptionTier): void {
    const features = TierManager.getAvailableFeatures(user);
    const oldFeatures = TierManager.getAvailableFeatures({
      ...user,
      subscriptionTier: oldTier
    });

    // Find features that changed access
    const newFeatures = features.filter(f => 
      !oldFeatures.some(of => of.id === f.id)
    );
    
    const removedFeatures = oldFeatures.filter(f => 
      !features.some(nf => nf.id === f.id)
    );

    // Emit events for changed features
    newFeatures.forEach(feature => 
      this.emitFeatureAccessChange(user.id, feature.id, true)
    );
    
    removedFeatures.forEach(feature => 
      this.emitFeatureAccessChange(user.id, feature.id, false)
    );

    // Update skip tracker if needed
    skipTracker.updateUserTier(user.id, user);
  }

  /**
   * Get feature usage statistics
   */
  public getFeatureUsageStats(userId: string): FeatureUsageLimit[] {
    const tracker = this.usageTrackers.get(userId);
    if (!tracker) return [];

    return Array.from(tracker.featureUsage.values());
  }

  /**
   * Reset feature usage (for testing or admin purposes)
   */
  public resetFeatureUsage(userId: string, featureId?: string): void {
    const tracker = this.usageTrackers.get(userId);
    if (!tracker) return;

    if (featureId) {
      tracker.featureUsage.delete(featureId);
    } else {
      tracker.featureUsage.clear();
    }
  }

  /**
   * Clean up user data
   */
  public cleanup(userId: string): void {
    this.usageTrackers.delete(userId);
  }

  /**
   * Get all locked features for user with upgrade benefits
   */
  public getLockedFeaturesWithBenefits(user: User | null): Array<{
    feature: PremiumFeature;
    benefit: string;
    tier: SubscriptionTier;
  }> {
    const lockedFeatures = TierManager.getLockedFeatures(user);
    const suggestedTier = TierManager.getSuggestedUpgrade(user) || 'premium';

    return lockedFeatures.map(feature => ({
      feature,
      benefit: this.getFeatureBenefit(feature.id),
      tier: suggestedTier
    }));
  }

  /**
   * Get benefit description for a feature
   */
  private getFeatureBenefit(featureId: string): string {
    const benefits: Record<string, string> = {
      'unlimited_skips': 'Skip as many songs as you want, anytime',
      'high_quality_audio': 'Crystal clear 320kbps audio streaming',
      'ad_free_listening': 'Uninterrupted music experience',
      'offline_downloads': 'Listen to your music anywhere, even without internet',
      'equalizer_access': 'Customize your sound with our advanced equalizer',
      'crossfade': 'Seamless transitions between your favorite tracks',
      'custom_playlist_artwork': 'Personalize your playlists with custom images',
      'advanced_visualizer': 'Enhanced visual experience that reacts to your music'
    };

    return benefits[featureId] || 'Enhanced music experience';
  }
}

// Export singleton instance
export const featureGate = new FeatureGateService();

// Export utility functions
export const FeatureGateUtils = {
  /**
   * Check if feature is premium-only
   */
  isPremiumFeature(featureId: string): boolean {
    const feature = TierManager.getAvailableFeatures({ subscriptionTier: 'free' } as User)
      .find(f => f.id === featureId);
    return !feature;
  },

  /**
   * Get feature icon
   */
  getFeatureIcon(featureId: string): string {
    const icons: Record<string, string> = {
      'unlimited_skips': '⏭️',
      'high_quality_audio': '🎵',
      'ad_free_listening': '🚫',
      'offline_downloads': '⬇️',
      'equalizer_access': '🎚️',
      'crossfade': '🔄',
      'custom_playlist_artwork': '🖼️',
      'advanced_visualizer': '📊'
    };

    return icons[featureId] || '⭐';
  },

  /**
   * Format feature name for display
   */
  formatFeatureName(featureId: string): string {
    return featureId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Get upgrade CTA text for feature
   */
  getUpgradeCTA(featureId: string): string {
    const ctas: Record<string, string> = {
      'unlimited_skips': 'Get Unlimited Skips',
      'high_quality_audio': 'Upgrade Audio Quality',
      'ad_free_listening': 'Remove Ads',
      'offline_downloads': 'Download Music',
      'equalizer_access': 'Unlock Equalizer',
      'crossfade': 'Enable Crossfade',
      'custom_playlist_artwork': 'Customize Playlists',
      'advanced_visualizer': 'Enhance Visuals'
    };

    return ctas[featureId] || 'Upgrade to Premium';
  }
};