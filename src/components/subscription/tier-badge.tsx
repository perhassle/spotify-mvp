'use client';

import React from 'react';
import { Crown, Users, GraduationCap, Gift } from 'lucide-react';
import { User, SubscriptionTier } from '@/types';
import { TierManager } from '@/lib/subscription/tier-manager';

interface TierBadgeProps {
  user: User | null;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_CONFIG = {
  free: {
    icon: Gift,
    colors: 'bg-gray-100 text-gray-700 border-gray-200',
    darkColors: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  },
  premium: {
    icon: Crown,
    colors: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
    darkColors: 'dark:from-yellow-900 dark:to-yellow-800 dark:text-yellow-100'
  },
  student: {
    icon: GraduationCap,
    colors: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
    darkColors: 'dark:from-blue-900 dark:to-blue-800 dark:text-blue-100'
  },
  family: {
    icon: Users,
    colors: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
    darkColors: 'dark:from-purple-900 dark:to-purple-800 dark:text-purple-100'
  }
};

const SIZE_CONFIG = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    gap: 'space-x-1'
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    gap: 'space-x-1.5'
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    gap: 'space-x-2'
  }
};

export function TierBadge({ 
  user, 
  showText = true, 
  size = 'md', 
  className = '' 
}: TierBadgeProps) {
  if (!user) return null;

  const tier = user.subscriptionTier;
  const config = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  
  const Icon = config.icon;
  const displayName = TierManager.getTierDisplayName(tier);

  return (
    <div className={`
      inline-flex items-center ${sizeConfig.gap} ${sizeConfig.container} 
      ${config.colors} ${config.darkColors}
      border rounded-full font-medium transition-all duration-200
      ${className}
    `}>
      <Icon className={sizeConfig.icon} />
      {showText && (
        <span>{displayName}</span>
      )}
    </div>
  );
}

// Status badge that shows subscription status with expiry info
interface StatusBadgeProps {
  user: User | null;
  detailed?: boolean;
  className?: string;
}

export function StatusBadge({ user, detailed = false, className = '' }: StatusBadgeProps) {
  if (!user) return null;

  const statusMessage = TierManager.getSubscriptionStatusMessage(user);
  const isExpiring = TierManager.isSubscriptionExpiring(user);
  const isInTrial = TierManager.isInTrial(user);
  const daysRemaining = TierManager.getTrialDaysRemaining(user);

  const getStatusColor = () => {
    if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'past_due') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (isExpiring || user.subscriptionStatus === 'canceled') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    
    if (isInTrial) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    
    if (user.subscriptionTier === 'free') {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className={`
      inline-flex items-center px-3 py-1 text-sm font-medium border rounded-full
      ${getStatusColor()}
      ${className}
    `}>
      {detailed ? statusMessage : user.subscriptionStatus}
      
      {isInTrial && detailed && (
        <span className="ml-2 text-xs">
          ({daysRemaining} days left)
        </span>
      )}
    </div>
  );
}

// Upgrade prompt badge
interface UpgradeBadgeProps {
  user: User | null;
  onClick?: () => void;
  className?: string;
}

export function UpgradeBadge({ user, onClick, className = '' }: UpgradeBadgeProps) {
  if (!user || TierManager.isPremiumUser(user)) return null;

  const suggestedTier = TierManager.getSuggestedUpgrade(user);
  const tierConfig = suggestedTier ? TIER_CONFIG[suggestedTier] : TIER_CONFIG.premium;
  const Icon = tierConfig.icon;

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium
        bg-gradient-to-r from-yellow-400 to-yellow-600 text-white
        hover:from-yellow-500 hover:to-yellow-700
        border-0 rounded-full transition-all duration-200
        transform hover:scale-105 active:scale-95
        ${className}
      `}
    >
      <Icon className="w-4 h-4" />
      <span>Upgrade</span>
    </button>
  );
}

// Premium features indicator
interface FeaturesBadgeProps {
  user: User | null;
  showCount?: boolean;
  className?: string;
}

export function FeaturesBadge({ user, showCount = true, className = '' }: FeaturesBadgeProps) {
  if (!user) return null;

  const availableFeatures = TierManager.getAvailableFeatures(user);
  const lockedFeatures = TierManager.getLockedFeatures(user);

  if (lockedFeatures.length === 0) {
    return (
      <div className={`
        inline-flex items-center space-x-1 px-2 py-1 text-xs
        bg-green-100 text-green-800 border border-green-200 rounded-full
        ${className}
      `}>
        <Crown className="w-3 h-3" />
        <span>All features unlocked</span>
      </div>
    );
  }

  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 text-xs
      bg-amber-100 text-amber-800 border border-amber-200 rounded-full
      ${className}
    `}>
      <Gift className="w-3 h-3" />
      {showCount ? (
        <span>{lockedFeatures.length} features locked</span>
      ) : (
        <span>Premium features available</span>
      )}
    </div>
  );
}

// Compact tier display for headers/navbars
interface CompactTierDisplayProps {
  user: User | null;
  onClick?: () => void;
  className?: string;
}

export function CompactTierDisplay({ user, onClick, className = '' }: CompactTierDisplayProps) {
  if (!user) return null;

  const tier = user.subscriptionTier;
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;
  const isPremium = TierManager.isPremiumUser(user);
  const isInTrial = TierManager.isInTrial(user);

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        ${className}
      `}
    >
      <div className={`
        p-1.5 rounded-full ${config.colors} ${config.darkColors}
      `}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="text-left">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {TierManager.getTierDisplayName(tier)}
          {isInTrial && (
            <span className="ml-1 text-xs text-blue-600">Trial</span>
          )}
        </div>
        
        {!isPremium && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Upgrade available
          </div>
        )}
      </div>
    </button>
  );
}