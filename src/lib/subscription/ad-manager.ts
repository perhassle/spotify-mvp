import { MockAd, AdConfiguration, User, Track } from '@/types';
import { TierManager } from './tier-manager';

/**
 * Ad management system for free users
 * Handles ad insertion, playback, and tracking
 */

// Mock ad database
const MOCK_ADS: MockAd[] = [
  {
    id: 'ad-001',
    title: 'Spotify Premium - No Ads, Just Music',
    advertiser: 'Spotify',
    duration: 30,
    audioUrl: '/audio/ads/spotify-premium-ad.mp3',
    imageUrl: '/images/ads/spotify-premium.jpg',
    clickUrl: '/premium',
    skipable: false
  },
  {
    id: 'ad-002',
    title: 'Coffee Shop Music - Perfect Vibes',
    advertiser: 'Local Coffee Co.',
    duration: 20,
    audioUrl: '/audio/ads/coffee-shop-ad.mp3',
    imageUrl: '/images/ads/coffee-shop.jpg',
    clickUrl: '/ads/coffee-shop',
    skipable: true,
    skipableAfter: 15
  },
  {
    id: 'ad-003',
    title: 'Upgrade to Premium - Unlimited Skips',
    advertiser: 'Spotify',
    duration: 25,
    audioUrl: '/audio/ads/unlimited-skips-ad.mp3',
    imageUrl: '/images/ads/unlimited-skips.jpg',
    clickUrl: '/premium',
    skipable: false
  },
  {
    id: 'ad-004',
    title: 'New Headphones - Studio Quality',
    advertiser: 'AudioTech',
    duration: 30,
    audioUrl: '/audio/ads/headphones-ad.mp3',
    imageUrl: '/images/ads/headphones.jpg',
    clickUrl: '/ads/audiotech',
    skipable: true,
    skipableAfter: 10
  },
  {
    id: 'ad-005',
    title: 'Stream Without Interruptions',
    advertiser: 'Spotify',
    duration: 15,
    audioUrl: '/audio/ads/no-interruptions-ad.mp3',
    imageUrl: '/images/ads/no-interruptions.jpg',
    clickUrl: '/premium',
    skipable: false
  }
];

// Ad configuration for different scenarios
const AD_CONFIGS: Record<string, AdConfiguration> = {
  default: {
    frequency: 3, // Every 3 songs
    minDuration: 15,
    maxDuration: 30,
    skipableAfter: 10
  },
  heavy: {
    frequency: 2, // Every 2 songs (for users who skip a lot)
    minDuration: 20,
    maxDuration: 30,
    skipableAfter: 15
  },
  light: {
    frequency: 4, // Every 4 songs (for new users)
    minDuration: 15,
    maxDuration: 25,
    skipableAfter: 10
  }
};

interface AdPlaybackState {
  currentAd: MockAd | null;
  isPlaying: boolean;
  progress: number;
  canSkip: boolean;
  skipableAt: number;
}

interface UserAdSession {
  userId: string;
  tracksPlayedSinceLastAd: number;
  lastAdTime: Date;
  totalAdsPlayed: number;
  adConfiguration: AdConfiguration;
  preferredAdTypes: string[];
}

class AdManagerService {
  private userSessions: Map<string, UserAdSession> = new Map();
  private adPlaybackState: AdPlaybackState = {
    currentAd: null,
    isPlaying: false,
    progress: 0,
    canSkip: false,
    skipableAt: 0
  };

  /**
   * Initialize ad session for user
   */
  private initializeUserSession(userId: string, user: User): UserAdSession {
    // Determine ad configuration based on user behavior
    // For demo, we'll use default config
    const config = AD_CONFIGS.default || AD_CONFIGS['default'] || {
      frequency: 3,
      minDuration: 15,
      maxDuration: 30,
      skipableAfter: 10
    };

    const session: UserAdSession = {
      userId,
      tracksPlayedSinceLastAd: 0,
      lastAdTime: new Date(0), // Start of epoch
      totalAdsPlayed: 0,
      adConfiguration: config,
      preferredAdTypes: ['spotify', 'music'] // Based on user preferences
    };

    this.userSessions.set(userId, session);
    return session;
  }

  /**
   * Check if an ad should be played before the next track
   */
  public shouldPlayAd(user: User | null, nextTrack: Track): boolean {
    if (!user || TierManager.isPremiumUser(user)) {
      return false; // No ads for premium users
    }

    let session = this.userSessions.get(user.id);
    if (!session) {
      session = this.initializeUserSession(user.id, user);
    }

    // Check if enough tracks have been played since last ad
    const shouldPlay = session.tracksPlayedSinceLastAd >= session.adConfiguration.frequency;
    
    // Also check time-based rules (don't play ads too frequently)
    const timeSinceLastAd = Date.now() - session.lastAdTime.getTime();
    const minimumTimeBetweenAds = 5 * 60 * 1000; // 5 minutes minimum
    
    return shouldPlay && timeSinceLastAd > minimumTimeBetweenAds;
  }

  /**
   * Get the next ad to play
   */
  public getNextAd(user: User): MockAd | null {
    if (!user || TierManager.isPremiumUser(user)) {
      return null;
    }

    let session = this.userSessions.get(user.id);
    if (!session) {
      session = this.initializeUserSession(user.id, user);
    }

    // Filter ads based on duration preferences
    const suitableAds = MOCK_ADS.filter(ad => 
      ad.duration >= session.adConfiguration.minDuration &&
      ad.duration <= session.adConfiguration.maxDuration
    );

    if (suitableAds.length === 0) {
      return MOCK_ADS[0] || null; // Fallback to first ad
    }

    // Prioritize Spotify premium ads for free users
    const spotifyAds = suitableAds.filter(ad => ad.advertiser === 'Spotify');
    const otherAds = suitableAds.filter(ad => ad.advertiser !== 'Spotify');

    // 70% chance of Spotify ad, 30% other ads
    const useSpotifyAd = Math.random() < 0.7 && spotifyAds.length > 0;
    const adsPool = useSpotifyAd ? spotifyAds : otherAds;

    if (adsPool.length === 0) {
      return suitableAds[Math.floor(Math.random() * suitableAds.length)] || null;
    }

    return adsPool[Math.floor(Math.random() * adsPool.length)] || null;
  }

  /**
   * Start ad playback
   */
  public startAdPlayback(ad: MockAd): AdPlaybackState {
    this.adPlaybackState = {
      currentAd: ad,
      isPlaying: true,
      progress: 0,
      canSkip: ad.skipable && (ad.skipableAfter || 0) === 0,
      skipableAt: ad.skipableAfter || 0
    };

    // Emit ad start event
    this.emitAdEvent('adStart', ad);
    
    return { ...this.adPlaybackState };
  }

  /**
   * Update ad playback progress
   */
  public updateAdProgress(progress: number): AdPlaybackState {
    if (!this.adPlaybackState.currentAd) {
      return this.adPlaybackState;
    }

    this.adPlaybackState.progress = progress;
    
    // Check if ad can now be skipped
    if (this.adPlaybackState.currentAd.skipable && 
        progress >= this.adPlaybackState.skipableAt &&
        !this.adPlaybackState.canSkip) {
      this.adPlaybackState.canSkip = true;
      this.emitAdEvent('adSkippable', this.adPlaybackState.currentAd);
    }

    return { ...this.adPlaybackState };
  }

  /**
   * Skip current ad
   */
  public skipAd(user: User): boolean {
    if (!this.adPlaybackState.currentAd || !this.adPlaybackState.canSkip) {
      return false;
    }

    const ad = this.adPlaybackState.currentAd;
    this.completeAd(user, true);
    
    this.emitAdEvent('adSkipped', ad);
    return true;
  }

  /**
   * Complete ad playback
   */
  public completeAd(user: User, wasSkipped: boolean = false): void {
    if (!this.adPlaybackState.currentAd) {
      return;
    }

    const ad = this.adPlaybackState.currentAd;
    
    // Update user session
    const session = this.userSessions.get(user.id);
    if (session) {
      session.tracksPlayedSinceLastAd = 0; // Reset track counter
      session.lastAdTime = new Date();
      session.totalAdsPlayed++;
    }

    // Reset ad playback state
    this.adPlaybackState = {
      currentAd: null,
      isPlaying: false,
      progress: 0,
      canSkip: false,
      skipableAt: 0
    };

    // Emit completion event
    this.emitAdEvent(wasSkipped ? 'adSkipped' : 'adComplete', ad);
  }

  /**
   * Track when a regular track is played
   */
  public trackTrackPlay(user: User): void {
    if (TierManager.isPremiumUser(user)) {
      return; // Don't track for premium users
    }

    let session = this.userSessions.get(user.id);
    if (!session) {
      session = this.initializeUserSession(user.id, user);
    }

    session.tracksPlayedSinceLastAd++;
  }

  /**
   * Get current ad playback state
   */
  public getAdPlaybackState(): AdPlaybackState {
    return { ...this.adPlaybackState };
  }

  /**
   * Get user ad statistics
   */
  public getUserAdStats(userId: string): {
    totalAdsPlayed: number;
    tracksUntilNextAd: number;
    adFrequency: number;
  } {
    const session = this.userSessions.get(userId);
    if (!session) {
      return {
        totalAdsPlayed: 0,
        tracksUntilNextAd: AD_CONFIGS.default?.frequency || 3,
        adFrequency: AD_CONFIGS.default?.frequency || 3
      };
    }

    const tracksUntilNextAd = Math.max(0, 
      session.adConfiguration.frequency - session.tracksPlayedSinceLastAd
    );

    return {
      totalAdsPlayed: session.totalAdsPlayed,
      tracksUntilNextAd,
      adFrequency: session.adConfiguration.frequency
    };
  }

  /**
   * Update ad configuration for user (e.g., based on behavior)
   */
  public updateAdConfiguration(userId: string, config: Partial<AdConfiguration>): void {
    const session = this.userSessions.get(userId);
    if (session) {
      session.adConfiguration = { ...session.adConfiguration, ...config };
    }
  }

  /**
   * Handle ad click
   */
  public handleAdClick(ad: MockAd): void {
    this.emitAdEvent('adClick', ad);
    
    // In a real app, this would track the click and potentially open the link
    if (ad.clickUrl && typeof window !== 'undefined') {
      window.open(ad.clickUrl, '_blank');
    }
  }

  /**
   * Clean up user session
   */
  public cleanup(userId: string): void {
    this.userSessions.delete(userId);
  }

  /**
   * Emit ad events for UI updates
   */
  private emitAdEvent(eventType: string, ad: MockAd): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adEvent', {
        detail: {
          type: eventType,
          ad,
          playbackState: this.adPlaybackState
        }
      }));
    }
  }

  /**
   * Get all available ads (for admin/debugging)
   */
  public getAllAds(): MockAd[] {
    return [...MOCK_ADS];
  }

  /**
   * Add custom ad (for admin)
   */
  public addAd(ad: MockAd): void {
    MOCK_ADS.push(ad);
  }
}

// Export singleton instance
export const adManager = new AdManagerService();

// Export utility functions
export const AdUtils = {
  /**
   * Format ad duration
   */
  formatAdDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes}:00`;
    }
  },

  /**
   * Get ad skip message
   */
  getSkipMessage(ad: MockAd, progress: number): string {
    if (!ad.skipable) {
      return 'This ad cannot be skipped';
    }

    const skipableAfter = ad.skipableAfter || 0;
    if (progress < skipableAfter) {
      const remainingTime = skipableAfter - progress;
      return `Skip in ${remainingTime}s`;
    }

    return 'Skip Ad';
  },

  /**
   * Check if ad is a premium promotion
   */
  isPremiumAd(ad: MockAd): boolean {
    return ad.advertiser === 'Spotify' && 
           (ad.title.toLowerCase().includes('premium') || 
            ad.title.toLowerCase().includes('upgrade'));
  }
};