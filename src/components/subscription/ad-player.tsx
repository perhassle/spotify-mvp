'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, ExternalLink, X } from 'lucide-react';
import { MockAd, User } from '@/types';
import { adManager, AdUtils } from '@/lib/subscription/ad-manager';
import { Button } from '@/components/ui/button';

interface AdPlayerProps {
  user: User | null;
  onAdComplete: () => void;
  onAdSkip?: () => void;
  className?: string;
}

export function AdPlayer({ 
  user, 
  onAdComplete, 
  onAdSkip, 
  className = '' 
}: AdPlayerProps) {
  const [currentAd, setCurrentAd] = useState<MockAd | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [timeUntilSkippable, setTimeUntilSkippable] = useState(0);

  useEffect(() => {
    const handleAdEvent = (event: CustomEvent) => {
      const { type, ad, playbackState } = event.detail;
      
      switch (type) {
        case 'adStart':
          setCurrentAd(ad);
          setIsPlaying(true);
          setProgress(0);
          setCanSkip(ad.skipable && (ad.skipableAfter || 0) === 0);
          setTimeUntilSkippable(ad.skipableAfter || 0);
          break;
          
        case 'adSkippable':
          setCanSkip(true);
          setTimeUntilSkippable(0);
          break;
          
        case 'adComplete':
        case 'adSkipped':
          setCurrentAd(null);
          setIsPlaying(false);
          setProgress(0);
          setCanSkip(false);
          onAdComplete();
          break;
      }
    };

    window.addEventListener('adEvent', handleAdEvent as EventListener);

    return () => {
      window.removeEventListener('adEvent', handleAdEvent as EventListener);
    };
  }, [onAdComplete]);

  // Simulate ad progress
  useEffect(() => {
    if (!currentAd || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        
        // Update time until skippable
        if (timeUntilSkippable > 0) {
          setTimeUntilSkippable(Math.max(0, timeUntilSkippable - 1));
        }
        
        // Check if ad should be skippable now
        if (currentAd.skipable && newProgress >= (currentAd.skipableAfter || 0) && !canSkip) {
          setCanSkip(true);
          setTimeUntilSkippable(0);
        }
        
        // Complete ad when duration is reached
        if (newProgress >= currentAd.duration) {
          handleAdComplete();
          return currentAd.duration;
        }
        
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAd, isPlaying, canSkip, timeUntilSkippable]);

  const handleAdComplete = () => {
    if (user && currentAd) {
      adManager.completeAd(user, false);
    }
  };

  const handleAdSkip = () => {
    if (user && currentAd && canSkip) {
      const skipped = adManager.skipAd(user);
      if (skipped && onAdSkip) {
        onAdSkip();
      }
    }
  };

  const handleAdClick = () => {
    if (currentAd) {
      adManager.handleAdClick(currentAd);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!currentAd) return null;

  const progressPercentage = (progress / currentAd.duration) * 100;
  const remainingTime = currentAd.duration - progress;

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white ${className}`}>
      {/* Ad Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 px-2 py-1 rounded text-xs font-semibold">
            AD
          </div>
          <span className="text-sm">
            {AdUtils.formatAdDuration(remainingTime)} remaining
          </span>
        </div>
        
        {canSkip && (
          <button
            onClick={handleAdSkip}
            className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Skip Ad</span>
          </button>
        )}
        
        {!canSkip && timeUntilSkippable > 0 && (
          <div className="text-sm text-white/70">
            Skip in {timeUntilSkippable}s
          </div>
        )}
      </div>

      {/* Ad Content */}
      <div className="p-6">
        <div className="flex items-center space-x-4">
          {/* Ad Image */}
          {currentAd.imageUrl && (
            <div 
              className="w-20 h-20 rounded-lg bg-white/10 flex-shrink-0 cursor-pointer overflow-hidden"
              onClick={handleAdClick}
            >
              <img
                src={currentAd.imageUrl}
                alt={currentAd.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ad Info */}
          <div className="flex-1 min-w-0">
            <h3 
              className="text-lg font-bold mb-1 cursor-pointer hover:underline"
              onClick={handleAdClick}
            >
              {currentAd.title}
            </h3>
            <p className="text-white/80 text-sm mb-2">
              {currentAd.advertiser}
            </p>
            
            {currentAd.clickUrl && (
              <button
                onClick={handleAdClick}
                className="flex items-center space-x-1 text-sm bg-white text-blue-600 px-3 py-1 rounded-full hover:bg-white/90 transition-colors font-medium"
              >
                <span>Learn More</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            
            <Volume2 className="w-5 h-5 text-white/70" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{AdUtils.formatAdDuration(progress)}</span>
            <span>{AdUtils.formatAdDuration(currentAd.duration)}</span>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt */}
      {AdUtils.isPremiumAd(currentAd) && (
        <div className="bg-black/20 p-4 text-center">
          <p className="text-sm mb-2">
            Tired of ads? Upgrade to Premium for ad-free listening!
          </p>
          <Button
            onClick={() => {
              // Handle upgrade click
              console.log('Upgrade clicked from ad');
            }}
            className="bg-white text-blue-600 hover:bg-white/90"
          >
            Try Premium Free
          </Button>
        </div>
      )}
    </div>
  );
}

// Mini ad player for use in minimized player
interface MiniAdPlayerProps {
  user: User | null;
  onExpand?: () => void;
  className?: string;
}

export function MiniAdPlayer({ user, onExpand, className = '' }: MiniAdPlayerProps) {
  const [currentAd, setCurrentAd] = useState<MockAd | null>(null);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const handleAdEvent = (event: CustomEvent) => {
      const { type, ad } = event.detail;
      
      switch (type) {
        case 'adStart':
          setCurrentAd(ad);
          setProgress(0);
          setCanSkip(ad.skipable && (ad.skipableAfter || 0) === 0);
          break;
          
        case 'adSkippable':
          setCanSkip(true);
          break;
          
        case 'adComplete':
        case 'adSkipped':
          setCurrentAd(null);
          setProgress(0);
          setCanSkip(false);
          break;
      }
    };

    window.addEventListener('adEvent', handleAdEvent as EventListener);

    return () => {
      window.removeEventListener('adEvent', handleAdEvent as EventListener);
    };
  }, []);

  // Update progress
  useEffect(() => {
    if (!currentAd) return;

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, currentAd.duration));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAd]);

  if (!currentAd) return null;

  const progressPercentage = (progress / currentAd.duration) * 100;
  const remainingTime = currentAd.duration - progress;

  return (
    <div 
      className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 cursor-pointer ${className}`}
      onClick={onExpand}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-semibold">
            AD
          </div>
          <span className="text-sm font-medium truncate">
            {currentAd.title}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs">
            {AdUtils.formatAdDuration(remainingTime)}
          </span>
          
          {canSkip && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (user) {
                  adManager.skipAd(user);
                }
              }}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-2">
        <div className="w-full bg-white/20 rounded-full h-0.5">
          <div
            className="bg-white h-0.5 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}