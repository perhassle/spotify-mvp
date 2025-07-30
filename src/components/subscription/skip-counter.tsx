'use client';

import React, { useState, useEffect } from 'react';
import { SkipForward, Crown, Clock } from 'lucide-react';
import { User } from '@/types';
import { skipTracker, SkipUtils } from '@/lib/subscription/skip-tracker';
import { TierManager } from '@/lib/subscription/tier-manager';
import { useUpgradePrompt } from './upgrade-prompt';

interface SkipCounterProps {
  user: User | null;
  className?: string;
  showUpgradeButton?: boolean;
}

export function SkipCounter({ 
  user, 
  className = '',
  showUpgradeButton = true 
}: SkipCounterProps) {
  const [skipStatus, setSkipStatus] = useState({
    canSkip: true,
    skipCount: 0,
    remainingSkips: 6,
    resetTime: new Date(),
    isUnlimited: false
  });
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  
  const { showUpgradePrompt } = useUpgradePrompt();

  useEffect(() => {
    if (!user) return;

    // Get initial skip status
    const status = skipTracker.getSkipStatus(user);
    setSkipStatus(status);

    // Set up event listener for skip count updates
    const handleSkipUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.id) {
        setSkipStatus(prev => ({
          ...prev,
          skipCount: event.detail.skipCount,
          remainingSkips: event.detail.remainingSkips,
          resetTime: new Date(event.detail.resetTime)
        }));
      }
    };

    window.addEventListener('skipCountUpdate', handleSkipUpdate as EventListener);

    // Update time until reset every minute
    const updateTimer = () => {
      if (!status.isUnlimited && status.resetTime) {
        const timeRemaining = status.resetTime.getTime() - Date.now();
        if (timeRemaining > 0) {
          setTimeUntilReset(SkipUtils.formatTimeUntilReset(timeRemaining));
        } else {
          setTimeUntilReset('');
        }
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 60000); // Update every minute

    return () => {
      window.removeEventListener('skipCountUpdate', handleSkipUpdate as EventListener);
      clearInterval(timerInterval);
    };
  }, [user]);

  if (!user) return null;

  // Premium users don't need skip counter
  if (TierManager.isPremiumUser(user)) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <div className="flex items-center space-x-1 text-yellow-600">
          <Crown className="w-4 h-4" />
          <span className="font-medium">Unlimited skips</span>
        </div>
      </div>
    );
  }

  const handleUpgradeClick = () => {
    showUpgradePrompt({
      featureId: 'unlimited_skips',
      title: 'Unlimited Skips',
      description: 'Never run out of skips again with Premium',
      ctaText: 'Get Unlimited Skips'
    });
  };

  const isApproachingLimit = SkipUtils.isApproachingLimit(
    skipStatus.remainingSkips, 
    TierManager.getTierLimits(user.subscriptionTier).skipsPerHour
  );

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <SkipForward className={`w-4 h-4 ${
          skipStatus.canSkip ? 'text-gray-600' : 'text-gray-400'
        }`} />
        
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              isApproachingLimit ? 'text-amber-600' : 
              skipStatus.canSkip ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {skipStatus.remainingSkips} skip{skipStatus.remainingSkips !== 1 ? 's' : ''} left
            </span>
            
            {!skipStatus.canSkip && (
              <div className="flex items-center space-x-1 text-amber-600">
                <Clock className="w-3 h-3" />
                <span className="text-xs">
                  {timeUntilReset}
                </span>
              </div>
            )}
          </div>
          
          {(isApproachingLimit || !skipStatus.canSkip) && (
            <p className="text-xs text-gray-500">
              {SkipUtils.getSkipLimitMessage(skipStatus.remainingSkips, skipStatus.resetTime)}
            </p>
          )}
        </div>
      </div>

      {showUpgradeButton && (isApproachingLimit || !skipStatus.canSkip) && (
        <button
          onClick={handleUpgradeClick}
          className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 font-medium"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}

// Compact version for use in player controls
interface CompactSkipCounterProps {
  user: User | null;
  onUpgradeClick?: () => void;
}

export function CompactSkipCounter({ user, onUpgradeClick }: CompactSkipCounterProps) {
  const [skipStatus, setSkipStatus] = useState({
    canSkip: true,
    remainingSkips: 6,
    isUnlimited: false
  });

  useEffect(() => {
    if (!user) return;

    const status = skipTracker.getSkipStatus(user);
    setSkipStatus({
      canSkip: status.canSkip,
      remainingSkips: status.remainingSkips,
      isUnlimited: status.isUnlimited
    });

    const handleSkipUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.id) {
        setSkipStatus(prev => ({
          ...prev,
          remainingSkips: event.detail.remainingSkips,
          canSkip: event.detail.remainingSkips > 0
        }));
      }
    };

    window.addEventListener('skipCountUpdate', handleSkipUpdate as EventListener);

    return () => {
      window.removeEventListener('skipCountUpdate', handleSkipUpdate as EventListener);
    };
  }, [user]);

  if (!user || TierManager.isPremiumUser(user)) {
    return null;
  }

  if (!skipStatus.canSkip) {
    return (
      <button
        onClick={onUpgradeClick}
        className="text-xs text-amber-600 hover:text-amber-700 font-medium"
        title="Skip limit reached - Upgrade for unlimited skips"
      >
        No skips left
      </button>
    );
  }

  if (skipStatus.remainingSkips <= 2) {
    return (
      <span className="text-xs text-amber-600 font-medium">
        {skipStatus.remainingSkips} left
      </span>
    );
  }

  return null;
}

// Progress bar version for detailed views
interface SkipProgressProps {
  user: User | null;
  className?: string;
}

export function SkipProgress({ user, className = '' }: SkipProgressProps) {
  const [skipStatus, setSkipStatus] = useState({
    skipCount: 0,
    remainingSkips: 6,
    isUnlimited: false
  });

  useEffect(() => {
    if (!user) return;

    const status = skipTracker.getSkipStatus(user);
    setSkipStatus({
      skipCount: status.skipCount,
      remainingSkips: status.remainingSkips,
      isUnlimited: status.isUnlimited
    });

    const handleSkipUpdate = (event: CustomEvent) => {
      if (event.detail.userId === user.id) {
        setSkipStatus({
          skipCount: event.detail.skipCount,
          remainingSkips: event.detail.remainingSkips,
          isUnlimited: false
        });
      }
    };

    window.addEventListener('skipCountUpdate', handleSkipUpdate as EventListener);

    return () => {
      window.removeEventListener('skipCountUpdate', handleSkipUpdate as EventListener);
    };
  }, [user]);

  if (!user || TierManager.isPremiumUser(user)) {
    return null;
  }

  const maxSkips = TierManager.getTierLimits(user.subscriptionTier).skipsPerHour;
  const usedPercentage = (skipStatus.skipCount / maxSkips) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Skips used</span>
        <span className="font-medium">
          {skipStatus.skipCount} / {maxSkips}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            usedPercentage >= 80 ? 'bg-red-500' :
            usedPercentage >= 60 ? 'bg-amber-500' :
            'bg-green-500'
          }`}
          style={{ width: `${usedPercentage}%` }}
        />
      </div>
      
      {skipStatus.remainingSkips === 0 && (
        <p className="text-xs text-amber-600">
          Skip limit reached. Resets in 1 hour.
        </p>
      )}
    </div>
  );
}