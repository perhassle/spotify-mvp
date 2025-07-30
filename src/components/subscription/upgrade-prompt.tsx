'use client';

import React, { useState } from 'react';
import { X, Crown, Music, Download, Volume2, Zap, Shield } from 'lucide-react';
import { User, SubscriptionTier } from '@/types';
import { TierManager } from '@/lib/subscription/tier-manager';
import { Button } from '@/components/ui/button';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  featureId?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  targetTier?: SubscriptionTier;
}

const FEATURE_ICONS = {
  unlimited_skips: Zap,
  high_quality_audio: Volume2,
  ad_free_listening: Shield,
  offline_downloads: Download,
  equalizer_access: Music,
  crossfade: Music,
  custom_playlist_artwork: Music,
  advanced_visualizer: Music
};

export function UpgradePrompt({
  isOpen,
  onClose,
  user,
  featureId,
  title = 'Upgrade to Premium',
  description = 'Unlock all premium features',
  ctaText = 'Upgrade Now',
  targetTier = 'premium'
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would redirect to payment flow
      console.log(`Upgrading to ${targetTier}`);
      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just close the modal
      onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = TierManager.getLockedFeatures(user);
  const FeatureIcon = featureId ? FEATURE_ICONS[featureId as keyof typeof FEATURE_ICONS] : Crown;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-full mb-4">
              <FeatureIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-gray-600">
              {description}
            </p>
          </div>
        </div>

        {/* Feature-specific content */}
        {featureId && (
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                What you&apos;ll get:
              </h3>
              <p className="text-sm text-gray-600">
                {getFeatureDescription(featureId)}
              </p>
            </div>
          </div>
        )}

        {/* Premium benefits */}
        <div className="px-6 pb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Premium includes:
          </h3>
          <div className="space-y-3">
            {premiumFeatures.slice(0, 4).map((feature) => {
              const Icon = FEATURE_ICONS[feature.id as keyof typeof FEATURE_ICONS] || Music;
              return (
                <div key={feature.id} className="flex items-center space-x-3">
                  <div className="bg-green-100 p-1 rounded">
                    <Icon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {feature.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                $9.99
                <span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cancel anytime
              </p>
              {user?.subscriptionTier === 'free' && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  Start your free trial today!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-semibold py-3 rounded-lg"
          >
            {isLoading ? 'Processing...' : ctaText}
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Maybe later
          </Button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-400">
            By upgrading, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

function getFeatureDescription(featureId: string): string {
  const descriptions: Record<string, string> = {
    unlimited_skips: 'Skip as many songs as you want, whenever you want. No more waiting!',
    high_quality_audio: 'Stream music in crystal clear 320kbps quality for the best listening experience.',
    ad_free_listening: 'Enjoy uninterrupted music with no ads between your favorite songs.',
    offline_downloads: 'Download your favorite music and listen anywhere, even without internet.',
    equalizer_access: 'Customize your sound with our advanced equalizer and audio effects.',
    crossfade: 'Seamless transitions between tracks for a smooth listening experience.',
    custom_playlist_artwork: 'Personalize your playlists with custom artwork and images.',
    advanced_visualizer: 'Enhanced visual experience that reacts beautifully to your music.'
  };

  return descriptions[featureId] || 'Unlock this premium feature and enhance your music experience.';
}

// Hook for managing upgrade prompts
export function useUpgradePrompt() {
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    featureId?: string;
    title?: string;
    description?: string;
    ctaText?: string;
    targetTier?: SubscriptionTier;
  }>({
    isOpen: false
  });

  const showUpgradePrompt = (config: {
    featureId?: string;
    title?: string;
    description?: string;
    ctaText?: string;
    targetTier?: SubscriptionTier;
  }) => {
    setPromptState({
      isOpen: true,
      ...config
    });
  };

  const hideUpgradePrompt = () => {
    setPromptState({ isOpen: false });
  };

  return {
    ...promptState,
    showUpgradePrompt,
    hideUpgradePrompt
  };
}