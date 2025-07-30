'use client';

import React, { useState, useEffect } from 'react';
import { Music, RotateCcw, Crown, Lock } from 'lucide-react';
import { User } from '@/types';
import { featureGate } from '@/lib/subscription/feature-gate';
import { TierManager } from '@/lib/subscription/tier-manager';
import { Button } from '@/components/ui/button';

interface PremiumEqualizerProps {
  user: User | null;
  className?: string;
  onSettingsChange?: (settings: EqualizerSettings) => void;
}

interface EqualizerSettings {
  enabled: boolean;
  preset: string;
  bands: number[]; // 10-band EQ values (-12 to +12 dB)
}

const EQ_PRESETS = {
  flat: {
    name: 'Flat',
    description: 'No adjustments',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  rock: {
    name: 'Rock',
    description: 'Enhanced bass and treble',
    bands: [3, 2, -1, -2, 1, 2, 3, 4, 4, 3]
  },
  pop: {
    name: 'Pop',
    description: 'Balanced for popular music',
    bands: [1, 2, 3, 2, 0, -1, 1, 2, 3, 2]
  },
  jazz: {
    name: 'Jazz',
    description: 'Warm mids and smooth highs',
    bands: [2, 1, 1, 2, 1, 1, 0, 1, 2, 2]
  },
  classical: {
    name: 'Classical',
    description: 'Enhanced dynamics',
    bands: [3, 2, 1, 0, 0, 0, 1, 2, 3, 4]
  },
  electronic: {
    name: 'Electronic',
    description: 'Heavy bass and crisp highs',
    bands: [4, 3, 1, 0, -1, 1, 2, 3, 4, 5]
  },
  vocal: {
    name: 'Vocal',
    description: 'Enhanced voice clarity',
    bands: [0, 1, 2, 3, 2, 1, 2, 3, 2, 1]
  },
  bass_boost: {
    name: 'Bass Boost',
    description: 'Extra low-end punch',
    bands: [6, 5, 3, 2, 1, 0, 0, 0, 0, 0]
  }
};

const FREQUENCY_BANDS = [
  '32Hz', '64Hz', '125Hz', '250Hz', '500Hz', 
  '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'
];

export function PremiumEqualizer({ 
  user, 
  className = '', 
  onSettingsChange 
}: PremiumEqualizerProps) {
  const [settings, setSettings] = useState<EqualizerSettings>({
    enabled: false,
    preset: 'flat',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  });
  
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(TierManager.hasFeatureAccess(user, 'equalizer_access'));
    }
  }, [user]);

  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const handleBandChange = (bandIndex: number, value: number) => {
    if (!hasAccess) return;
    
    const newBands = [...settings.bands];
    newBands[bandIndex] = Math.max(-12, Math.min(12, value));
    
    setSettings(prev => ({
      ...prev,
      bands: newBands,
      preset: 'custom' // Switch to custom when manually adjusted
    }));
  };

  const handlePresetChange = (presetName: string) => {
    if (!hasAccess) return;
    
    const preset = EQ_PRESETS[presetName as keyof typeof EQ_PRESETS];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        preset: presetName,
        bands: [...preset.bands]
      }));
    }
  };

  const toggleEqualizer = async () => {
    if (!user) return;
    
    if (!hasAccess) {
      // Show upgrade prompt
      const accessResult = await featureGate.useFeature(user, 'equalizer_access');
      if (!accessResult.success) {
        console.log('Equalizer access denied:', accessResult.error);
        return;
      }
    }
    
    setSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const resetEqualizer = () => {
    if (!hasAccess) return;
    
    setSettings(prev => ({
      ...prev,
      preset: 'flat',
      bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }));
  };

  const handleSliderMouseDown = (bandIndex: number) => {
    if (hasAccess) {
      setIsDragging(bandIndex);
    }
  };

  const handleSliderMouseUp = () => {
    setIsDragging(null);
  };

  const handleSliderMove = (event: React.MouseEvent, bandIndex: number) => {
    if (!hasAccess || isDragging !== bandIndex) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const height = rect.height;
    const y = event.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, 1 - (y / height)));
    const value = Math.round((percentage * 24) - 12); // -12 to +12 range
    
    handleBandChange(bandIndex, value);
  };

  if (!user) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Sign in to access the equalizer</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Music className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Equalizer</h3>
              <p className="text-sm text-purple-100">
                Customize your sound
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasAccess ? (
              <>
                <Button
                  onClick={resetEqualizer}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={toggleEqualizer}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    settings.enabled
                      ? 'bg-white text-purple-600 hover:bg-gray-100'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {settings.enabled ? 'ON' : 'OFF'}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Premium</span>
              </div>
            )}
          </div>
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
                Premium Equalizer
              </h4>
              <p className="text-sm text-yellow-700">
                Fine-tune your audio with our advanced 10-band equalizer
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-yellow-700 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
              <span>10-band parametric equalizer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
              <span>8 professional presets</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
              <span>Custom settings saved per device</span>
            </div>
          </div>
          
          <Button
            onClick={() => {
              // Show upgrade prompt
              console.log('Show upgrade prompt for equalizer');
            }}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            Upgrade to Premium
          </Button>
        </div>
      )}

      {/* Presets */}
      <div className="p-4 bg-gray-50 border-b">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Presets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(EQ_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              disabled={!hasAccess}
              className={`
                p-2 rounded-lg text-sm font-medium transition-all
                ${settings.preset === key
                  ? 'bg-purple-600 text-white'
                  : hasAccess
                    ? 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
                ${!hasAccess && 'opacity-50'}
              `}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Equalizer Bands */}
      <div className="p-6">
        <div className="flex items-end justify-between space-x-2 h-64">
          {FREQUENCY_BANDS.map((frequency, index) => {
            const value = settings.bands[index] || 0;
            const percentage = ((value + 12) / 24) * 100; // Convert -12/+12 to 0-100%
            
            return (
              <div key={frequency} className="flex flex-col items-center space-y-2 flex-1">
                {/* Value Display */}
                <div className="text-xs font-mono text-gray-600 w-8 text-center">
                  {value > 0 ? '+' : ''}{value}
                </div>
                
                {/* Slider Track */}
                <div 
                  className={`
                    relative w-8 h-48 bg-gray-200 rounded-full cursor-pointer
                    ${!hasAccess && 'opacity-50 cursor-not-allowed'}
                  `}
                  onMouseDown={() => handleSliderMouseDown(index)}
                  onMouseUp={handleSliderMouseUp}
                  onMouseMove={(e) => handleSliderMove(e, index)}
                  onMouseLeave={handleSliderMouseUp}
                >
                  {/* Center Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400 transform -translate-y-px"></div>
                  
                  {/* Slider Handle */}
                  <div
                    className={`
                      absolute w-8 h-4 rounded-full transform -translate-y-1/2 transition-all
                      ${settings.enabled && hasAccess
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg'
                        : 'bg-gray-400'
                      }
                      ${isDragging === index ? 'scale-110' : ''}
                    `}
                    style={{
                      top: `${100 - percentage}%`
                    }}
                  />
                  
                  {/* Fill */}
                  {settings.enabled && hasAccess && (
                    <div
                      className={`
                        absolute w-full rounded-full transition-all
                        ${value >= 0 
                          ? 'bg-gradient-to-t from-purple-500/30 to-purple-500/10' 
                          : 'bg-gradient-to-b from-red-500/30 to-red-500/10'
                        }
                      `}
                      style={{
                        [value >= 0 ? 'bottom' : 'top']: '50%',
                        height: `${Math.abs(percentage - 50)}%`
                      }}
                    />
                  )}
                </div>
                
                {/* Frequency Label */}
                <div className="text-xs text-gray-500 font-medium">
                  {frequency}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Current Preset Info */}
        {hasAccess && settings.preset !== 'custom' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Music className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {EQ_PRESETS[settings.preset as keyof typeof EQ_PRESETS]?.name}
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {EQ_PRESETS[settings.preset as keyof typeof EQ_PRESETS]?.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact equalizer toggle for player controls
interface CompactEqualizerToggleProps {
  user: User | null;
  enabled: boolean;
  onToggle: () => void;
}

export function CompactEqualizerToggle({ 
  user, 
  enabled, 
  onToggle 
}: CompactEqualizerToggleProps) {
  const hasAccess = user ? TierManager.hasFeatureAccess(user, 'equalizer_access') : false;

  return (
    <button
      onClick={onToggle}
      disabled={!hasAccess}
      className={`
        p-2 rounded-full transition-all
        ${enabled && hasAccess
          ? 'bg-purple-600 text-white shadow-lg'
          : hasAccess
            ? 'text-gray-600 hover:bg-gray-100'
            : 'text-gray-400 cursor-not-allowed'
        }
      `}
      title={
        !hasAccess ? 'Equalizer - Premium Feature' :
        enabled ? 'Disable Equalizer' : 'Enable Equalizer'
      }
    >
      <Music className="w-4 h-4" />
      {!hasAccess && (
        <Lock className="w-2 h-2 absolute -top-1 -right-1 text-yellow-500" />
      )}
    </button>
  );
}