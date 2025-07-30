import { User, SubscriptionTier, SubscriptionStatus, PremiumFeature, FeatureGate } from '@/types';

/**
 * Comprehensive subscription tier management system
 * Handles user subscription tiers, feature access, and upgrade logic
 */

// Feature definitions for different subscription tiers
export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'unlimited_skips',
    name: 'Unlimited Skips',
    description: 'Skip as many songs as you want',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'playback'
  },
  {
    id: 'high_quality_audio',
    name: 'High Quality Audio',
    description: 'Stream music at 320kbps',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'quality'
  },
  {
    id: 'ad_free_listening',
    name: 'Ad-Free Listening',
    description: 'Listen without interruptions',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'playback'
  },
  {
    id: 'offline_downloads',
    name: 'Offline Downloads',
    description: 'Download music for offline listening',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'offline'
  },
  {
    id: 'equalizer_access',
    name: 'Equalizer',
    description: 'Customize your sound with our equalizer',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'customization'
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    description: 'Seamless transitions between tracks',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'playback'
  },
  {
    id: 'custom_playlist_artwork',
    name: 'Custom Playlist Artwork',
    description: 'Add custom images to your playlists',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'customization'
  },
  {
    id: 'advanced_visualizer',
    name: 'Advanced Visualizer',
    description: 'Enhanced audio visualizations',
    tier: ['premium', 'family', 'student'],
    enabled: true,
    category: 'customization'
  }
];

// Feature gates with upgrade prompts
export const FEATURE_GATES: FeatureGate[] = [
  {
    featureId: 'unlimited_skips',
    requiredTier: 'premium',
    fallbackBehavior: 'prompt',
    upgradePrompt: {
      title: 'Skip Limit Reached',
      description: 'You\'ve reached your hourly skip limit. Upgrade to Premium for unlimited skips.',
      ctaText: 'Upgrade to Premium'
    }
  },
  {
    featureId: 'high_quality_audio',
    requiredTier: 'premium',
    fallbackBehavior: 'downgrade',
    upgradePrompt: {
      title: 'High Quality Audio',
      description: 'Upgrade to Premium for high-quality 320kbps audio streaming.',
      ctaText: 'Upgrade for Better Quality'
    }
  },
  {
    featureId: 'ad_free_listening',
    requiredTier: 'premium',
    fallbackBehavior: 'disable',
    upgradePrompt: {
      title: 'Ad-Free Listening',
      description: 'Enjoy uninterrupted music with Premium. No ads, just music.',
      ctaText: 'Go Ad-Free'
    }
  },
  {
    featureId: 'offline_downloads',
    requiredTier: 'premium',
    fallbackBehavior: 'prompt',
    upgradePrompt: {
      title: 'Offline Downloads',
      description: 'Download your favorite music and listen offline anywhere.',
      ctaText: 'Download Music'
    }
  },
  {
    featureId: 'equalizer_access',
    requiredTier: 'premium',
    fallbackBehavior: 'prompt',
    upgradePrompt: {
      title: 'Equalizer Locked',
      description: 'Customize your sound with our premium equalizer.',
      ctaText: 'Unlock Equalizer'
    }
  }
];

// Tier limits and configurations
export const TIER_LIMITS = {
  free: {
    skipsPerHour: 6,
    audioQuality: 'low' as const,
    adFrequency: 3, // Every 3 songs
    offlineDownloads: 0,
    playlistCount: 50,
    queueSize: 100
  },
  premium: {
    skipsPerHour: Infinity,
    audioQuality: 'high' as const,
    adFrequency: 0, // No ads
    offlineDownloads: 10000,
    playlistCount: Infinity,
    queueSize: Infinity
  },
  student: {
    skipsPerHour: Infinity,
    audioQuality: 'high' as const,
    adFrequency: 0, // No ads
    offlineDownloads: 10000,
    playlistCount: Infinity,
    queueSize: Infinity
  },
  family: {
    skipsPerHour: Infinity,
    audioQuality: 'high' as const,
    adFrequency: 0, // No ads
    offlineDownloads: 10000,
    playlistCount: Infinity,
    queueSize: Infinity
  }
};

export class TierManager {
  /**
   * Check if user has access to a specific feature
   */
  static hasFeatureAccess(user: User | null, featureId: string): boolean {
    if (!user) return false;
    
    const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;
    
    return feature.tier.includes(user.subscriptionTier);
  }

  /**
   * Get user's tier limits
   */
  static getTierLimits(tier: SubscriptionTier) {
    return TIER_LIMITS[tier];
  }

  /**
   * Check if user is premium (any paid tier)
   */
  static isPremiumUser(user: User | null): boolean {
    if (!user) return false;
    return user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active';
  }

  /**
   * Check if user is in trial period
   */
  static isInTrial(user: User | null): boolean {
    if (!user || !user.trialEndDate) return false;
    return new Date() < user.trialEndDate && user.subscriptionStatus === 'trialing';
  }

  /**
   * Get days remaining in trial
   */
  static getTrialDaysRemaining(user: User | null): number {
    if (!user || !user.trialEndDate) return 0;
    const now = new Date();
    const trialEnd = user.trialEndDate;
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get upgrade prompt for a feature
   */
  static getUpgradePrompt(featureId: string): FeatureGate | null {
    return FEATURE_GATES.find(gate => gate.featureId === featureId) || null;
  }

  /**
   * Get all available features for user's tier
   */
  static getAvailableFeatures(user: User | null): PremiumFeature[] {
    if (!user) return PREMIUM_FEATURES.filter(f => f.tier.includes('free'));
    return PREMIUM_FEATURES.filter(f => f.tier.includes(user.subscriptionTier));
  }

  /**
   * Get locked features for user's tier
   */
  static getLockedFeatures(user: User | null): PremiumFeature[] {
    if (!user) return PREMIUM_FEATURES.filter(f => !f.tier.includes('free'));
    return PREMIUM_FEATURES.filter(f => !f.tier.includes(user.subscriptionTier));
  }

  /**
   * Check if subscription is expired or about to expire
   */
  static isSubscriptionExpiring(user: User | null, daysThreshold = 3): boolean {
    if (!user || !user.subscriptionExpiry) return false;
    
    const now = new Date();
    const expiry = user.subscriptionExpiry;
    const diffTime = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return daysRemaining <= daysThreshold && daysRemaining > 0;
  }

  /**
   * Get subscription status message
   */
  static getSubscriptionStatusMessage(user: User | null): string {
    if (!user) return 'Sign in to access premium features';
    
    switch (user.subscriptionStatus) {
      case 'active':
        if (user.subscriptionTier === 'free') {
          return 'Free plan - Upgrade for more features';
        }
        return `${user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} plan active`;
      
      case 'trialing':
        const daysRemaining = this.getTrialDaysRemaining(user);
        return `Free trial - ${daysRemaining} days remaining`;
      
      case 'past_due':
        return 'Payment overdue - Update payment method';
      
      case 'canceled':
        return 'Subscription canceled - Access until expiry';
      
      case 'expired':
        return 'Subscription expired - Renew to continue';
      
      default:
        return 'Subscription status unknown';
    }
  }

  /**
   * Get tier display name
   */
  static getTierDisplayName(tier: SubscriptionTier): string {
    switch (tier) {
      case 'free':
        return 'Free';
      case 'premium':
        return 'Premium';
      case 'student':
        return 'Premium Student';
      case 'family':
        return 'Premium Family';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get tier badge color for UI
   */
  static getTierBadgeColor(tier: SubscriptionTier): string {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'family':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Calculate suggested upgrade tier
   */
  static getSuggestedUpgrade(user: User | null): SubscriptionTier | null {
    if (!user || user.subscriptionTier !== 'free') return null;
    
    // For now, suggest premium as the default upgrade
    // In a real app, this could be based on user behavior, demographics, etc.
    return 'premium';
  }

  /**
   * Check if user can perform action based on usage limits
   */
  static canPerformAction(
    user: User | null, 
    action: 'skip' | 'download' | 'createPlaylist',
    currentUsage: number
  ): boolean {
    if (!user) return false;
    
    const limits = this.getTierLimits(user.subscriptionTier);
    
    switch (action) {
      case 'skip':
        return currentUsage < limits.skipsPerHour;
      case 'download':
        return currentUsage < limits.offlineDownloads;
      case 'createPlaylist':
        return currentUsage < limits.playlistCount;
      default:
        return true;
    }
  }
}