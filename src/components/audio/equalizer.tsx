"use client";

import { useState, useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EqualizerProps {
  className?: string;
  onClose?: () => void;
}

interface EqualizerBandConfig {
  frequency: number;
  label: string;
  gain: number;
}

const EQUALIZER_BANDS: Omit<EqualizerBandConfig, 'gain'>[] = [
  { frequency: 32, label: "32Hz" },
  { frequency: 64, label: "64Hz" },
  { frequency: 125, label: "125Hz" },
  { frequency: 250, label: "250Hz" },
  { frequency: 500, label: "500Hz" },
  { frequency: 1000, label: "1kHz" },
  { frequency: 2000, label: "2kHz" },
  { frequency: 4000, label: "4kHz" },
  { frequency: 8000, label: "8kHz" },
  { frequency: 16000, label: "16kHz" },
];

const EQUALIZER_PRESETS = {
  flat: { name: "Flat", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  rock: { name: "Rock", gains: [3, 2, -1, -1, -1, 1, 2, 3, 3, 3] },
  pop: { name: "Pop", gains: [1, 2, 3, 2, 0, -1, -2, -1, 1, 2] },
  jazz: { name: "Jazz", gains: [2, 1, 0, 1, -1, -1, 0, 1, 2, 3] },
  classical: { name: "Classical", gains: [3, 2, 1, 0, -1, -1, 0, 1, 2, 3] },
  bass: { name: "Bass Boost", gains: [6, 4, 2, 1, 0, -1, -2, -3, -3, -3] },
  treble: { name: "Treble Boost", gains: [-3, -3, -2, -1, 0, 1, 2, 4, 6, 8] },
  vocal: { name: "Vocal", gains: [-2, -1, 0, 1, 3, 3, 2, 1, 0, -1] },
  acoustic: { name: "Acoustic", gains: [2, 1, 0, 0, 1, 1, 2, 2, 1, 0] },
  electronic: { name: "Electronic", gains: [4, 3, 1, 0, -1, 0, 1, 2, 3, 4] },
};

export function Equalizer({ className, onClose }: EqualizerProps) {
  const {
    isEqualizerEnabled,
    equalizerPreset,
    toggleEqualizer,
    setEqualizerPreset,
    setEqualizerBand,
  } = usePlayerStore();

  const [bands, setBands] = useState<EqualizerBandConfig[]>(
    EQUALIZER_BANDS.map(band => ({ ...band, gain: 0 }))
  );

  // Update bands when preset changes
  useEffect(() => {
    const preset = EQUALIZER_PRESETS[equalizerPreset as keyof typeof EQUALIZER_PRESETS];
    if (preset) {
      const newBands = EQUALIZER_BANDS.map((band, index) => ({
        ...band,
        gain: preset.gains[index] || 0,
      }));
      setBands(newBands);
    }
  }, [equalizerPreset]);

  const handleBandChange = (bandIndex: number, gain: number) => {
    const newBands = [...bands];
    if (newBands[bandIndex]) {
      newBands[bandIndex].gain = gain;
    }
    setBands(newBands);
    setEqualizerBand(bandIndex, gain);
  };

  const handlePresetChange = (presetKey: string) => {
    setEqualizerPreset(presetKey);
  };

  const resetEqualizer = () => {
    handlePresetChange('flat');
  };

  return (
    <div className={cn(
      "equalizer bg-gray-800 rounded-lg border border-gray-700 p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">Equalizer</h3>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-xs px-2 py-1",
              isEqualizerEnabled ? "text-spotify-green bg-spotify-green/10" : "text-gray-400"
            )}
            onClick={toggleEqualizer}
          >
            {isEqualizerEnabled ? "ON" : "OFF"}
          </Button>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Presets
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(EQUALIZER_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs px-2 py-1 h-8",
                equalizerPreset === key
                  ? "bg-spotify-green text-black font-medium"
                  : "text-gray-300 hover:text-white border border-gray-600"
              )}
              onClick={() => handlePresetChange(key)}
              disabled={!isEqualizerEnabled}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* EQ Controls */}
      <div className="mb-4">
        <div className="flex items-end justify-between space-x-2 h-48">
          {bands.map((band, index) => (
            <div key={band.frequency} className="flex flex-col items-center space-y-2">
              {/* Gain Value Display */}
              <div className="text-xs text-gray-400 font-mono w-10 text-center">
                {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}dB
              </div>
              
              {/* Vertical Slider */}
              <div className="relative h-32 w-6 flex items-center justify-center">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={band.gain}
                  onChange={(e) => handleBandChange(index, parseFloat(e.target.value))}
                  className="eq-slider"
                  style={{
                    transform: 'rotate(-90deg)',
                    width: '120px',
                    height: '4px',
                  }}
                  disabled={!isEqualizerEnabled}
                />
                
                {/* Center line indicator */}
                <div className="absolute w-full h-0.5 bg-gray-600 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              {/* Frequency Label */}
              <div className="text-xs text-gray-400 font-mono">
                {band.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={resetEqualizer}
          disabled={!isEqualizerEnabled}
        >
          Reset
        </Button>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">-12dB</span>
          <div className="w-20 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded" />
          <span className="text-xs text-gray-400">+12dB</span>
        </div>
      </div>
    </div>
  );
}

// Custom styles for vertical sliders
const equalizerStyles = `
  .eq-slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .eq-slider::-webkit-slider-track {
    background: #4B5563;
    height: 4px;
    border-radius: 2px;
  }

  .eq-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .eq-slider:disabled::-webkit-slider-thumb {
    background: #6B7280;
    cursor: not-allowed;
  }

  .eq-slider::-moz-range-track {
    background: #4B5563;
    height: 4px;
    border-radius: 2px;
    border: none;
  }

  .eq-slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .eq-slider:disabled::-moz-range-thumb {
    background: #6B7280;
    cursor: not-allowed;
  }

  /* Visual feedback for active bands */
  .eq-slider:not(:disabled)::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(29, 185, 84, 0.3);
  }

  .eq-slider:not(:disabled)::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(29, 185, 84, 0.3);
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleId = "equalizer-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = equalizerStyles;
    document.head.appendChild(style);
  }
}