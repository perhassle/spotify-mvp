import { SkipTracker, User } from '@/types';
import { TierManager } from './tier-manager';

/**
 * Skip tracking system for managing free user skip limitations
 * Tracks skips per hour with automatic reset functionality
 */

class SkipTrackingService {
  private skipTrackers: Map<string, SkipTracker> = new Map();
  private resetIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize skip tracker for a user
   */
  private initializeTracker(userId: string, user: User): SkipTracker {
    const limits = TierManager.getTierLimits(user.subscriptionTier);
    const now = new Date();
    const resetTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now

    const tracker: SkipTracker = {
      userId,
      skipCount: 0,
      hourlyLimit: limits.skipsPerHour,
      lastSkipTime: now,
      resetTime
    };

    this.skipTrackers.set(userId, tracker);
    this.scheduleReset(userId);
    
    return tracker;
  }

  /**
   * Schedule automatic reset of skip count
   */
  private scheduleReset(userId: string): void {
    // Clear existing interval if any
    const existingInterval = this.resetIntervals.get(userId);
    if (existingInterval) {
      clearTimeout(existingInterval);
    }

    const tracker = this.skipTrackers.get(userId);
    if (!tracker) return;

    const timeUntilReset = tracker.resetTime.getTime() - Date.now();
    
    const resetTimeout = setTimeout(() => {
      this.resetSkipCount(userId);
    }, Math.max(0, timeUntilReset));

    this.resetIntervals.set(userId, resetTimeout);
  }

  /**
   * Reset skip count for a user
   */
  private resetSkipCount(userId: string): void {
    const tracker = this.skipTrackers.get(userId);
    if (!tracker) return;

    const now = new Date();
    tracker.skipCount = 0;
    tracker.resetTime = new Date(now.getTime() + (60 * 60 * 1000)); // Next hour
    
    // Schedule next reset
    this.scheduleReset(userId);
    
    // Emit event for UI updates
    this.emitSkipCountUpdate(userId, tracker);
  }

  /**
   * Attempt to perform a skip
   */
  public attemptSkip(user: User): { success: boolean; remainingSkips: number; resetTime: Date } {
    if (!user) {
      return { success: false, remainingSkips: 0, resetTime: new Date() };
    }

    // Premium users have unlimited skips
    if (TierManager.isPremiumUser(user)) {
      return { success: true, remainingSkips: Infinity, resetTime: new Date() };
    }

    let tracker = this.skipTrackers.get(user.id);
    if (!tracker) {
      tracker = this.initializeTracker(user.id, user);
    }

    // Check if reset time has passed
    const now = new Date();
    if (now >= tracker.resetTime) {
      this.resetSkipCount(user.id);
      tracker = this.skipTrackers.get(user.id)!;
    }

    // Check if user has skips remaining
    if (tracker.skipCount >= tracker.hourlyLimit) {
      return {
        success: false,
        remainingSkips: 0,
        resetTime: tracker.resetTime
      };
    }

    // Perform skip
    tracker.skipCount++;
    tracker.lastSkipTime = now;

    const remainingSkips = Math.max(0, tracker.hourlyLimit - tracker.skipCount);
    
    // Emit update event
    this.emitSkipCountUpdate(user.id, tracker);

    return {
      success: true,
      remainingSkips,
      resetTime: tracker.resetTime
    };
  }

  /**
   * Get current skip status for user
   */
  public getSkipStatus(user: User | null): {
    canSkip: boolean;
    skipCount: number;
    remainingSkips: number;
    resetTime: Date;
    isUnlimited: boolean;
  } {
    if (!user) {
      return {
        canSkip: false,
        skipCount: 0,
        remainingSkips: 0,
        resetTime: new Date(),
        isUnlimited: false
      };
    }

    // Premium users have unlimited skips
    if (TierManager.isPremiumUser(user)) {
      return {
        canSkip: true,
        skipCount: 0,
        remainingSkips: Infinity,
        resetTime: new Date(),
        isUnlimited: true
      };
    }

    let tracker = this.skipTrackers.get(user.id);
    if (!tracker) {
      tracker = this.initializeTracker(user.id, user);
    }

    // Check if reset time has passed
    const now = new Date();
    if (now >= tracker.resetTime) {
      this.resetSkipCount(user.id);
      tracker = this.skipTrackers.get(user.id)!;
    }

    const remainingSkips = Math.max(0, tracker.hourlyLimit - tracker.skipCount);
    const canSkip = remainingSkips > 0;

    return {
      canSkip,
      skipCount: tracker.skipCount,
      remainingSkips,
      resetTime: tracker.resetTime,
      isUnlimited: false
    };
  }

  /**
   * Get time until next reset
   */
  public getTimeUntilReset(userId: string): number {
    const tracker = this.skipTrackers.get(userId);
    if (!tracker) return 0;

    return Math.max(0, tracker.resetTime.getTime() - Date.now());
  }

  /**
   * Force reset skip count (admin function)
   */
  public forceReset(userId: string): void {
    this.resetSkipCount(userId);
  }

  /**
   * Update user tier (when subscription changes)
   */
  public updateUserTier(userId: string, user: User): void {
    const tracker = this.skipTrackers.get(userId);
    if (!tracker) return;

    const limits = TierManager.getTierLimits(user.subscriptionTier);
    tracker.hourlyLimit = limits.skipsPerHour;

    // If upgraded to premium, clear limitations
    if (TierManager.isPremiumUser(user)) {
      const interval = this.resetIntervals.get(userId);
      if (interval) {
        clearTimeout(interval);
        this.resetIntervals.delete(userId);
      }
    }
  }

  /**
   * Clean up tracker for user (on logout)
   */
  public cleanup(userId: string): void {
    const interval = this.resetIntervals.get(userId);
    if (interval) {
      clearTimeout(interval);
      this.resetIntervals.delete(userId);
    }
    this.skipTrackers.delete(userId);
  }

  /**
   * Emit skip count update event
   */
  private emitSkipCountUpdate(userId: string, tracker: SkipTracker): void {
    // In a real app, this would emit events to UI components
    // For now, we'll use a simple custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skipCountUpdate', {
        detail: {
          userId,
          skipCount: tracker.skipCount,
          remainingSkips: Math.max(0, tracker.hourlyLimit - tracker.skipCount),
          resetTime: tracker.resetTime
        }
      }));
    }
  }

  /**
   * Get all active trackers (for debugging/admin)
   */
  public getAllTrackers(): SkipTracker[] {
    return Array.from(this.skipTrackers.values());
  }

  /**
   * Get tracker by user ID
   */
  public getTracker(userId: string): SkipTracker | null {
    return this.skipTrackers.get(userId) || null;
  }
}

// Export singleton instance
export const skipTracker = new SkipTrackingService();

// Export utility functions
export const SkipUtils = {
  /**
   * Format time until reset
   */
  formatTimeUntilReset(milliseconds: number): string {
    const minutes = Math.ceil(milliseconds / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  },

  /**
   * Get skip limit message
   */
  getSkipLimitMessage(remainingSkips: number, resetTime: Date): string {
    if (remainingSkips === 0) {
      const timeUntilReset = resetTime.getTime() - Date.now();
      const formattedTime = this.formatTimeUntilReset(timeUntilReset);
      return `Skip limit reached. Resets in ${formattedTime}.`;
    } else if (remainingSkips === 1) {
      return `1 skip remaining this hour.`;
    } else {
      return `${remainingSkips} skips remaining this hour.`;
    }
  },

  /**
   * Check if user is approaching skip limit
   */
  isApproachingLimit(remainingSkips: number, hourlyLimit: number): boolean {
    if (hourlyLimit === Infinity) return false;
    return remainingSkips <= Math.max(1, Math.floor(hourlyLimit * 0.2)); // 20% of limit
  }
};