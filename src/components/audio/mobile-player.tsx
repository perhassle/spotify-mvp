"use client";

import { useState } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format-utils";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ChevronUpIcon,
  QueueListIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";

interface MobilePlayerProps {
  className?: string;
}

export function MobilePlayer({ className }: MobilePlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
  } = usePlayerStore();

  if (!currentTrack) {
    return null;
  }

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      {/* Compact Player Bar */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 z-20 bg-black border-t border-gray-800",
          "md:hidden safe-bottom",
          className
        )}
      >
        <div
          className="flex items-center p-2 cursor-pointer"
          onClick={() => setIsExpanded(true)}
          role="button"
          tabIndex={0}
          aria-label="Expand player"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsExpanded(true);
            }
          }}
        >
          {/* Album Art */}
          <img
            src={currentTrack.imageUrl || currentTrack.album.imageUrl || "/placeholder.svg"}
            alt={`${currentTrack.title} album art`}
            className="w-12 h-12 rounded mr-3 flex-shrink-0"
          />

          {/* Track Info */}
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-sm font-medium text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {currentTrack.artist.name}
            </p>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className={cn(
              "p-3 rounded-full bg-white text-black",
              "hover:scale-105 transition-transform",
              "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-spotify-green transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Expanded Full-Screen Player */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col safe-top safe-bottom",
          isExpanded ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
            aria-label="Minimize player"
          >
            <ChevronUpIcon className="h-6 w-6 text-white rotate-180" />
          </button>

          <p className="text-sm font-medium text-white">Now Playing</p>

          <button
            className="p-2 -mr-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
            aria-label="Show queue"
          >
            <QueueListIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center px-8">
          <img
            src={currentTrack.imageUrl || currentTrack.album.imageUrl || "/placeholder.svg"}
            alt={`${currentTrack.title} album art`}
            className="w-full max-w-sm aspect-square rounded-lg shadow-2xl"
          />
        </div>

        {/* Track Info & Controls */}
        <div className="px-6 pb-8">
          {/* Track Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-2xl font-bold text-white truncate">
                {currentTrack.title}
              </h2>
              <p className="text-lg text-gray-400 truncate">
                {currentTrack.artist.name}
              </p>
            </div>

            <button
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
              aria-label="Like song"
            >
              <HeartIconOutline className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={progress}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Seek track"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatDuration(progress)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={previousTrack}
              className="p-3 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
              aria-label="Previous track"
            >
              <BackwardIcon className="h-6 w-6 text-white" />
            </button>

            <button
              onClick={togglePlayPause}
              className={cn(
                "p-4 rounded-full bg-white text-black",
                "hover:scale-105 transition-transform",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8" />
              ) : (
                <PlayIcon className="h-8 w-8 ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-3 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
              aria-label="Next track"
            >
              <ForwardIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

<style jsx>{`
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`}</style>