'use client';

import React, { useState, useEffect } from 'react';
import { Shuffle, Crown, Lock, RotateCcw } from 'lucide-react';
import { User } from '@/types';
import { featureGate } from '@/lib/subscription/feature-gate';
import { TierManager } from '@/lib/subscription/tier-manager';
import { Button } from '@/components/ui/button';

interface CrossfadeControlProps {
  user: User | null;
  initialDuration?: number;
  onDurationChange?: (duration: number) => void;
  className?: string;
}

export function CrossfadeControl({ 
  user, 
  initialDuration = 3, 
  onDurationChange,
  className = '' 
}: CrossfadeControlProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [enabled, setEnabled] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(TierManager.hasFeatureAccess(user, 'crossfade'));
    }
  }, [user]);

  useEffect(() => {
    onDurationChange?.(enabled && hasAccess ? duration : 0);
  }, [duration, enabled, hasAccess, onDurationChange]);

  const handleDurationChange = (newDuration: number) => {
    if (!hasAccess) return;
    
    const clampedDuration = Math.max(0, Math.min(12, newDuration));
    setDuration(clampedDuration);
  };

  const toggleCrossfade = async () => {
    if (!user) return;
    
    if (!hasAccess) {
      const accessResult = await featureGate.useFeature(user, 'crossfade', duration);
      if (!accessResult.success) {
        console.log('Crossfade access denied:', accessResult.error);
        return;
      }
    }
    
    setEnabled(!enabled);
  };

  const resetToDefault = () => {
    if (!hasAccess) return;
    setDuration(3);
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Off';
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(1)}s`;
  };

  if (!user) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <Shuffle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Sign in to access crossfade</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Crossfade</h3>
              <p className="text-sm text-blue-100">
                Seamless track transitions
              </p>
            </div>
          </div>
          
          {hasAccess ? (
            <div className="flex items-center space-x-2">
              <Button
                onClick={resetToDefault}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={toggleCrossfade}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  enabled
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {enabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
              <Lock className="w-4 h-4" />
              <span className="text-sm">Premium</span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Gate */}
      {!hasAccess && (
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-yellow-500 p-2 rounded-full">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800">
                Premium Crossfade
              </h4>
              <p className="text-sm text-yellow-700">
                Eliminate silence between tracks with smooth transitions
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-yellow-700 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
              <span>Adjustable crossfade duration (0-12 seconds)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
              <span>Automatic tempo matching</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
              <span>Smart transition detection</span>
            </div>
          </div>
          
          <Button
            onClick={() => {
              console.log('Show upgrade prompt for crossfade');
            }}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            Upgrade for Crossfade
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Duration
              </label>
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                enabled && hasAccess
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {formatDuration(duration)}
              </span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="12"
                step="0.1"
                value={duration}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
                disabled={!hasAccess}
                className={`
                  w-full h-2 rounded-lg appearance-none cursor-pointer
                  ${hasAccess 
                    ? 'bg-gray-200' 
                    : 'bg-gray-100 cursor-not-allowed opacity-50'
                  }
                  slider
                `}
                style={{
                  background: hasAccess ? `linear-gradient(to right, 
                    ${enabled ? '#3B82F6' : '#9CA3AF'} 0%, 
                    ${enabled ? '#3B82F6' : '#9CA3AF'} ${(duration / 12) * 100}%, 
                    #E5E7EB ${(duration / 12) * 100}%, 
                    #E5E7EB 100%)` : '#F3F4F6'
                }}
              />
              
              {/* Tick marks */}
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0s</span>
                <span>3s</span>
                <span>6s</span>
                <span>12s</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          {hasAccess && enabled && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Crossfade Preview
              </h4>
              
              <div className="space-y-3">
                {/* Visual representation */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-blue-200 rounded-l">
                    <div className="h-full bg-blue-500 rounded-l" style={{ width: '70%' }}></div>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {formatDuration(duration)}
                  </div>
                  <div className="flex-1 h-2 bg-purple-200 rounded-r">
                    <div className="h-full bg-purple-500 rounded-r ml-auto" style={{ width: '30%' }}></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-blue-700">
                  <span>Current track fades out</span>
                  <span>Next track fades in</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {hasAccess && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Advanced Settings</h4>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    disabled={!enabled}
                    className={`rounded ${
                      enabled ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <span className={`text-sm ${
                    enabled ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    Smart gapless playback
                  </span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    disabled={!enabled}
                    className={`rounded ${
                      enabled ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <span className={`text-sm ${
                    enabled ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    Tempo matching
                  </span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    disabled={!enabled}
                    className={`rounded ${
                      enabled ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <span className={`text-sm ${
                    enabled ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    Volume normalization
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact crossfade toggle for player controls
interface CompactCrossfadeToggleProps {
  user: User | null;
  enabled: boolean;
  duration: number;
  onToggle: () => void;
  onDurationChange?: (duration: number) => void;
}

export function CompactCrossfadeToggle({ 
  user, 
  enabled, 
  duration,
  onToggle,
  onDurationChange 
}: CompactCrossfadeToggleProps) {
  const [showSlider, setShowSlider] = useState(false);
  const hasAccess = user ? TierManager.hasFeatureAccess(user, 'crossfade') : false;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onMouseEnter={() => setShowSlider(true)}
        onMouseLeave={() => setShowSlider(false)}
        disabled={!hasAccess}
        className={`
          p-2 rounded-full transition-all relative
          ${enabled && hasAccess
            ? 'bg-blue-600 text-white shadow-lg'
            : hasAccess
              ? 'text-gray-600 hover:bg-gray-100'
              : 'text-gray-400 cursor-not-allowed'
          }
        `}
        title={
          !hasAccess ? 'Crossfade - Premium Feature' :
          enabled ? `Crossfade: ${duration}s` : 'Enable Crossfade'
        }
      >
        <Shuffle className="w-4 h-4" />
        {!hasAccess && (
          <Lock className="w-2 h-2 absolute -top-1 -right-1 text-yellow-500" />
        )}
        {enabled && hasAccess && (
          <div className="absolute -bottom-1 -right-1 bg-white text-blue-600 text-xs px-1 rounded-full font-medium">
            {duration}s
          </div>
        )}
      </button>

      {/* Hover slider */}
      {showSlider && enabled && hasAccess && onDurationChange && (
        <div 
          className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded-lg shadow-lg whitespace-nowrap z-50"
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
        >
          <div className="text-xs mb-1">Crossfade: {duration}s</div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.1"
            value={duration}
            onChange={(e) => onDurationChange(parseFloat(e.target.value))}
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-white"
          />
        </div>
      )}
    </div>
  );
}