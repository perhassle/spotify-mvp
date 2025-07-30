"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayIcon, PauseIcon, PlusIcon, HeartIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutlineIcon, EllipsisHorizontalIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { useShareModalStore } from "@/stores/social-store";
import type { Track, ShareableContent } from "@/types";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  track: Track;
  index?: number;
  showArtwork?: boolean;
  variant?: "list" | "grid";
  onPlay?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onLike?: (track: Track) => void;
  isLiked?: boolean;
}

export function TrackCard({
  track,
  index,
  showArtwork = true,
  variant = "list",
  onPlay,
  onAddToQueue,
  onLike,
  isLiked = false,
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const { openShareModal } = useShareModalStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const showPlayButton = isHovered || isCurrentTrack;

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      if (onPlay) {
        onPlay(track);
      } else {
        play(track);
      }
    }
  };

  // Handle add to queue
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToQueue) {
      onAddToQueue(track);
    }
  };

  // Handle like
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(track);
    }
  };

  // Handle share
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareableContent: ShareableContent = {
      id: track.id,
      type: 'track',
      title: track.title,
      subtitle: track.artist.name,
      imageUrl: track.imageUrl,
      description: `Listen to "${track.title}" by ${track.artist.name}`,
      url: `/track/${track.id}`,
    };
    openShareModal(shareableContent);
  };

  if (variant === "grid") {
    return (
      <div
        className={cn(
          "group relative p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200",
          "cursor-pointer border border-transparent hover:border-white/10"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onPlay?.(track)}
      >
        {/* Album Artwork */}
        <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-white/10">
          {showArtwork && track.imageUrl && !imageError ? (
            <Image
              src={track.imageUrl}
              alt={`${track.title} artwork`}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {track.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
              showPlayButton ? "opacity-100" : "opacity-0"
            )}
          >
            <button
              onClick={handlePlayPause}
              className={cn(
                "w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 transition-all",
                "flex items-center justify-center shadow-lg hover:scale-105",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
              )}
              aria-label={isCurrentTrack && isPlaying ? "Pause track" : "Play track"}
            >
              {isCurrentTrack && isPlaying ? (
                <PauseIcon className="w-5 h-5 text-black" />
              ) : (
                <PlayIcon className="w-5 h-5 text-black ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Track Info */}
        <div className="space-y-1">
          <Link 
            href={`/track/${track.id}`}
            className="font-medium text-white truncate group-hover:text-green-400 transition-colors hover:underline block"
            onClick={(e) => e.stopPropagation()}
          >
            {track.title}
          </Link>
          <p className="text-sm text-white/60 truncate">
            <Link 
              href={`/artist/${track.artist.id}`}
              className="hover:underline hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist.name}
            </Link>
          </p>
          <p className="text-xs text-white/40 truncate">
            <Link 
              href={`/album/${track.album.id}`}
              className="hover:underline hover:text-white/60 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {track.album.title}
            </Link>
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            "absolute top-4 right-4 flex gap-2 transition-opacity",
            showPlayButton ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={handleLike}
            className={cn(
              "w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 transition-all",
              "flex items-center justify-center",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
          >
            {isLiked ? (
              <HeartIcon className="w-4 h-4 text-green-400" />
            ) : (
              <HeartOutlineIcon className="w-4 h-4 text-white" />
            )}
          </button>
          
          <button
            onClick={handleShare}
            className={cn(
              "w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 transition-all",
              "flex items-center justify-center",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label="Share track"
          >
            <ShareIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // List variant
  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all duration-200",
        "cursor-pointer min-h-[60px]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.(track)}
    >
      {/* Index or Play Button */}
      <div className="w-6 flex-shrink-0 text-center">
        {showPlayButton ? (
          <button
            onClick={handlePlayPause}
            className={cn(
              "w-6 h-6 rounded-full bg-green-500 hover:bg-green-400 transition-all",
              "flex items-center justify-center hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label={isCurrentTrack && isPlaying ? "Pause track" : "Play track"}
          >
            {isCurrentTrack && isPlaying ? (
              <PauseIcon className="w-3 h-3 text-black" />
            ) : (
              <PlayIcon className="w-3 h-3 text-black ml-0.5" />
            )}
          </button>
        ) : (
          <span className="text-sm text-white/40">
            {index !== undefined ? index + 1 : "•"}
          </span>
        )}
      </div>

      {/* Album Artwork */}
      {showArtwork && (
        <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-white/10">
          {track.imageUrl && !imageError ? (
            <Image
              src={track.imageUrl}
              alt={`${track.title} artwork`}
              width={48}
              height={48}
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {track.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="min-w-0">
            <Link 
              href={`/track/${track.id}`}
              className={cn(
                "font-medium truncate transition-colors hover:underline",
                isCurrentTrack ? "text-green-400" : "text-white group-hover:text-green-400"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {track.title}
            </Link>
            <p className="text-sm text-white/60 truncate">
              {track.isExplicit && (
                <span className="inline-block w-4 h-4 bg-white/20 text-white/60 text-xs font-bold rounded mr-2 text-center leading-4">
                  E
                </span>
              )}
              <Link 
                href={`/artist/${track.artist.id}`}
                className="hover:underline hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {track.artist.name}
              </Link>
              {' • '}
              <Link 
                href={`/album/${track.album.id}`}
                className="hover:underline hover:text-white/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {track.album.title}
              </Link>
            </p>
          </div>
          
          {/* Duration and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Action Buttons - Mobile */}
            <div className="flex gap-1 sm:hidden">
              <button
                onClick={handleLike}
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
              >
                {isLiked ? (
                  <HeartIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <HeartOutlineIcon className="w-4 h-4 text-white/60" />
                )}
              </button>
              
              <button
                onClick={handleAddToQueue}
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label="Add to queue"
              >
                <PlusIcon className="w-4 h-4 text-white/60" />
              </button>
              
              <button
                onClick={handleShare}
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label="Share track"
              >
                <ShareIcon className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Action Buttons - Desktop */}
            <div
              className={cn(
                "hidden sm:flex gap-1 transition-opacity",
                showPlayButton ? "opacity-100" : "opacity-0"
              )}
            >
              <button
                onClick={handleLike}
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
              >
                {isLiked ? (
                  <HeartIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <HeartOutlineIcon className="w-4 h-4 text-white/60" />
                )}
              </button>
              
              <button
                onClick={handleAddToQueue}
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label="Add to queue"
              >
                <PlusIcon className="w-4 h-4 text-white/60" />
              </button>
              
              <button
                onClick={handleShare}
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label="Share track"
              >
                <ShareIcon className="w-4 h-4 text-white/60" />
              </button>
              
              <button
                className={cn(
                  "w-8 h-8 rounded-full hover:bg-white/10 transition-all",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label="More options"
              >
                <EllipsisHorizontalIcon className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Duration */}
            <span className="text-sm text-white/40 tabular-nums">
              {formatDuration(track.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}