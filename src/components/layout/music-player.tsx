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
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface MusicPlayerProps {
  className?: string;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    shuffleMode,
    // play,
    // pause,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    setRepeatMode,
    toggleShuffle,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

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
    const modes: Array<typeof repeatMode> = ["off", "context", "track"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      className={cn(
        "music-player-bar fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-4",
        className,
      )}
    >
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
          className="h-8 w-8 text-gray-300 hover:text-white"
          onClick={() => setIsLiked(!isLiked)}
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
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-gray-300 hover:text-white",
              shuffleMode && "text-spotify-green",
            )}
            onClick={toggleShuffle}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-300 hover:text-white"
            onClick={previousTrack}
          >
            <BackwardIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="spotify"
            size="icon"
            className="h-10 w-10"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-300 hover:text-white"
            onClick={nextTrack}
          >
            <ForwardIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-gray-300 hover:text-white",
              repeatMode !== "off" && "text-spotify-green",
            )}
            onClick={handleRepeatClick}
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
            className="relative flex-1 h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
          >
            <div
              className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-100"
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

      {/* Right Section - Volume Control */}
      <div className="flex w-1/4 items-center justify-end space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-300 hover:text-white"
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
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
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
}

// Custom slider styles
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