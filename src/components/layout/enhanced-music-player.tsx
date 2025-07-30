"use client";

import { usePlayerStore } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  HeartIcon,
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  ForwardIcon as SkipForwardIcon,
  BackwardIcon as SkipBackwardIcon,
  AdjustmentsHorizontalIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface EnhancedMusicPlayerProps {
  className?: string;
}

export function EnhancedMusicPlayer({ className }: EnhancedMusicPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    shuffleMode,
    playbackRate,
    crossfadeDuration,
    isEqualizerEnabled,
    isVisualizerEnabled,
    skipCount,
    maxSkips,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    setRepeatMode,
    toggleShuffle,
    setPlaybackRate,
    setCrossfadeDuration,
    toggleEqualizer,
    toggleVisualizer,
    skipForward,
    skipBackward,
    initializeAudioEngine,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Initialize audio engine on mount
  useEffect(() => {
    initializeAudioEngine();
  }, [initializeAudioEngine]);

  // Handle progress bar click and drag
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    seekTo(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (duration === 0) return;

    let newTime = progress;
    const step = duration * 0.01; // 1% of total duration

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newTime = Math.max(0, progress - step);
        seekTo(newTime);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newTime = Math.min(duration, progress + step);
        seekTo(newTime);
        break;
      case 'Home':
        e.preventDefault();
        seekTo(0);
        break;
      case 'End':
        e.preventDefault();
        seekTo(duration);
        break;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !progressBarRef.current || duration === 0) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * duration;

      seekTo(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration, seekTo]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleRepeatClick = () => {
    const modes: Array<"off" | "context" | "track"> = ["off", "context", "track"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length] || "off";
    setRepeatMode(nextMode);
  };

  const handleNextTrack = () => {
    nextTrack();
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
  };

  const handleCrossfadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseFloat(e.target.value);
    setCrossfadeDuration(duration);
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const skipsRemaining = maxSkips - skipCount;

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      className={cn(
        "enhanced-music-player fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700",
        className,
      )}
    >
      {/* Advanced Controls Panel */}
      {showAdvancedControls && (
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between space-x-6">
            {/* Playback Speed */}
            <div className="flex items-center space-x-2">
              <label htmlFor="playback-speed" className="text-xs text-gray-300">Speed:</label>
              <select
                id="playback-speed"
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="bg-gray-700 text-white text-xs px-2 py-1 rounded min-h-[44px]"
                aria-label="Playback speed"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Crossfade Duration */}
            <div className="flex items-center space-x-2">
              <label htmlFor="crossfade-duration" className="text-xs text-gray-300">Crossfade:</label>
              <input
                id="crossfade-duration"
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={crossfadeDuration}
                onChange={handleCrossfadeChange}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider min-h-[44px]"
                aria-label="Crossfade duration in seconds"
              />
              <span className="text-xs text-gray-300 w-8">{crossfadeDuration}s</span>
            </div>

            {/* Equalizer Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs min-h-[44px] min-w-[44px]",
                isEqualizerEnabled ? "text-spotify-green" : "text-gray-300"
              )}
              onClick={toggleEqualizer}
              aria-label={`${isEqualizerEnabled ? 'Disable' : 'Enable'} equalizer`}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
              EQ
            </Button>

            {/* Visualizer Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs min-h-[44px] min-w-[44px]",
                isVisualizerEnabled ? "text-spotify-green" : "text-gray-300"
              )}
              onClick={toggleVisualizer}
              aria-label={`${isVisualizerEnabled ? 'Disable' : 'Enable'} audio visualizer`}
            >
              <ChartBarSquareIcon className="h-4 w-4 mr-1" />
              Visual
            </Button>

            {/* Skip Counter */}
            <div className="text-xs text-gray-300">
              Skips: {skipsRemaining}/{maxSkips}
            </div>
          </div>
        </div>
      )}

      {/* Main Player Bar */}
      <div className="flex h-20 items-center justify-between px-4">
        {/* Left Section - Current Track Info */}
        <div className="flex w-1/4 items-center space-x-3">
          <div className="relative h-12 w-12 overflow-hidden rounded">
            {currentTrack.imageUrl ? (
              <Image
                src={currentTrack.imageUrl}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium text-white">
              {currentTrack.title}
            </h4>
            <p className="truncate text-xs text-gray-300">
              {currentTrack.artist.name}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
            onClick={() => setIsLiked(!isLiked)}
            aria-label={`${isLiked ? 'Remove from' : 'Add to'} liked songs`}
          >
            {isLiked ? (
              <HeartIconSolid className="h-4 w-4 text-spotify-green" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Center Section - Player Controls */}
        <div className="flex w-1/2 flex-col items-center space-y-2">
          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]",
                shuffleMode && "text-spotify-green",
              )}
              onClick={toggleShuffle}
              aria-label={`${shuffleMode ? 'Disable' : 'Enable'} shuffle mode`}
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
              onClick={previousTrack}
              aria-label="Previous track"
            >
              <BackwardIcon className="h-5 w-5" />
            </Button>

            {/* Skip Backward Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
              onClick={() => skipBackward(15)}
              aria-label="Skip backward 15 seconds"
            >
              <SkipBackwardIcon className="h-4 w-4" />
              <span className="absolute -bottom-1 text-xs">15</span>
            </Button>

            <Button
              variant="spotify"
              size="icon"
              className="h-11 w-11 min-h-[44px] min-w-[44px]"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {/* Skip Forward Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
              onClick={() => skipForward(15)}
              aria-label="Skip forward 15 seconds"
            >
              <SkipForwardIcon className="h-4 w-4" />
              <span className="absolute -bottom-1 text-xs">15</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
              onClick={handleNextTrack}
              disabled={skipsRemaining <= 0}
              aria-label={skipsRemaining <= 0 ? "No skips remaining" : `Next track (${skipsRemaining} skips remaining)`}
            >
              <ForwardIcon className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]",
                repeatMode !== "off" && "text-spotify-green",
              )}
              onClick={handleRepeatClick}
              aria-label={`Repeat mode: ${repeatMode === 'off' ? 'disabled' : repeatMode === 'context' ? 'repeat playlist' : 'repeat track'}`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              {repeatMode === "track" && (
                <span className="absolute -bottom-1 -right-1 h-1.5 w-1.5 rounded-full bg-spotify-green"></span>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex w-full max-w-lg items-center space-x-2 text-xs text-gray-300">
            <span className="w-10 text-right">{formatDuration(progress)}</span>
            
            <div
              ref={progressBarRef}
              className="relative flex-1 h-1 bg-gray-600 rounded-full cursor-pointer min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-gray-900"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onKeyDown={handleProgressKeyDown}
              role="slider"
              aria-label="Seek position"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={progress}
              aria-valuetext={`${formatDuration(progress)} of ${formatDuration(duration)}`}
              tabIndex={0}
            >
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-white rounded-full transition-all duration-100 pointer-events-none"
                style={{ width: `${progressPercentage}%` }}
              />
              {isDragging && (
                <div
                  className="absolute top-1/2 h-3 w-3 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${progressPercentage}%` }}
                />
              )}
            </div>
            
            <span className="w-10">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right Section - Volume Control & Options */}
        <div className="flex w-1/4 items-center justify-end space-x-3">
          {/* Queue Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]",
              showQueue && "text-spotify-green"
            )}
            onClick={() => setShowQueue(!showQueue)}
            aria-label={`${showQueue ? 'Hide' : 'Show'} queue`}
          >
            <Bars3Icon className="h-4 w-4" />
          </Button>

          {/* Advanced Controls Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]",
              showAdvancedControls && "text-spotify-green"
            )}
            onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            aria-label={`${showAdvancedControls ? 'Hide' : 'Show'} advanced controls`}
          >
            {showAdvancedControls ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Volume Control */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <SpeakerXMarkIcon className="h-4 w-4" />
            ) : (
              <SpeakerWaveIcon className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider min-h-[44px]"
              aria-label={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom slider styles (same as before)
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .slider:hover::-webkit-slider-thumb {
    opacity: 1;
  }
  
  .slider::-moz-range-thumb {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: none;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .slider:hover::-moz-range-thumb {
    opacity: 1;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = sliderStyles;
  document.head.appendChild(style);
}