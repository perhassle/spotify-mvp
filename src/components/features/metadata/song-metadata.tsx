'use client';

import { PlayIcon, PauseIcon, HeartIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDuration, formatDate, formatPopularity } from '@/lib/format-utils';
import { AlbumArtwork } from '@/components/common/optimized-image';
import { GenreTags, CompactGenreDisplay } from '@/components/common/genre-tags';
import { usePlayerStore } from '@/stores/player-store';
import type { Track } from '@/types';

interface SongMetadataProps {
  track: Track;
  variant?: 'detailed' | 'compact' | 'list';
  showArtwork?: boolean;
  showGenres?: boolean;
  showPopularity?: boolean;
  showReleaseDate?: boolean;
  showTrackNumber?: boolean;
  showPlayButton?: boolean;
  showLikeButton?: boolean;
  showMoreButton?: boolean;
  isLiked?: boolean;
  className?: string;
  onPlay?: (track: Track) => void;
  onLike?: (trackId: string) => void;
  onMore?: (track: Track) => void;
  'data-testid'?: string;
}

/**
 * Comprehensive song metadata display component with multiple variants
 * Supports detailed view, compact view, and list view layouts
 */
export function SongMetadata({
  track,
  variant = 'detailed',
  showArtwork = true,
  showGenres = true,
  showPopularity = true,
  showReleaseDate = true,
  showTrackNumber = false,
  showPlayButton = true,
  showLikeButton = true,
  showMoreButton = true,
  isLiked = false,
  className,
  onPlay,
  onLike,
  onMore,
  'data-testid': testId,
}: SongMetadataProps) {
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      play(track);
      onPlay?.(track);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike?.(track.id);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMore?.(track);
  };

  if (variant === 'list') {
    return (
      <SongListItem
        track={track}
        showTrackNumber={showTrackNumber}
        showLikeButton={showLikeButton}
        showMoreButton={showMoreButton}
        isLiked={isLiked}
        isCurrentTrack={isCurrentTrack}
        isPlaying={isCurrentlyPlaying}
        onPlay={handlePlayClick}
        onLike={handleLikeClick}
        onMore={handleMoreClick}
        className={className}
        data-testid={testId}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <SongCompactView
        track={track}
        showArtwork={showArtwork}
        showPlayButton={showPlayButton}
        showLikeButton={showLikeButton}
        isLiked={isLiked}
        isCurrentTrack={isCurrentTrack}
        isPlaying={isCurrentlyPlaying}
        onPlay={handlePlayClick}
        onLike={handleLikeClick}
        className={className}
        data-testid={testId}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={testId}
    >
      <div className="flex items-start gap-4">
        {/* Album Artwork */}
        {showArtwork && (
          <div className="relative flex-shrink-0">
            <AlbumArtwork
              src={track.imageUrl}
              alt={`${track.title} album artwork`}
              size="lg"
              priority={false}
            />
            
            {showPlayButton && (
              <button
                onClick={handlePlayClick}
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/50 rounded-md transition-opacity duration-200",
                  isHovered || isCurrentlyPlaying ? "opacity-100" : "opacity-0",
                  "hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                )}
                aria-label={isCurrentlyPlaying ? "Pause track" : "Play track"}
              >
                {isCurrentlyPlaying ? (
                  <PauseIcon className="w-12 h-12 text-white" />
                ) : (
                  <PlayIcon className="w-12 h-12 text-white" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Track Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Track Title */}
              <h2 className="text-2xl font-bold text-gray-900 truncate mb-1">
                {track.title}
                {track.isExplicit && (
                  <span 
                    className="ml-2 text-xs bg-gray-400 text-white px-2 py-0.5 rounded"
                    aria-label="Explicit content"
                  >
                    E
                  </span>
                )}
              </h2>

              {/* Artist and Album Links */}
              <div className="flex items-center gap-2 text-lg text-gray-600 mb-2">
                <Link
                  href={`/artist/${track.artist.id}`}
                  className="hover:text-purple-600 hover:underline transition-colors duration-200"
                >
                  {track.artist.name}
                </Link>
                <span>•</span>
                <Link
                  href={`/album/${track.album.id}`}
                  className="hover:text-purple-600 hover:underline transition-colors duration-200"
                >
                  {track.album.title}
                </Link>
              </div>

              {/* Duration and Release Date */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>{formatDuration(track.duration)}</span>
                {showReleaseDate && (
                  <>
                    <span>•</span>
                    <span>{formatDate(track.releaseDate, 'year')}</span>
                  </>
                )}
                {showPopularity && (
                  <>
                    <span>•</span>
                    <span>{formatPopularity(track.popularity)} popularity</span>
                  </>
                )}
              </div>

              {/* Genres */}
              {showGenres && track.genres.length > 0 && (
                <GenreTags
                  genres={track.genres}
                  maxTags={4}
                  size="sm"
                  variant="subtle"
                  className="mb-3"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showLikeButton && (
                <button
                  onClick={handleLikeClick}
                  className={cn(
                    "p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                    isLiked
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-400 hover:text-red-500"
                  )}
                  aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
                >
                  {isLiked ? (
                    <HeartIcon className="w-6 h-6" />
                  ) : (
                    <HeartOutlineIcon className="w-6 h-6" />
                  )}
                </button>
              )}

              {showMoreButton && (
                <button
                  onClick={handleMoreClick}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label="More options"
                >
                  <EllipsisHorizontalIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact song view for tight spaces
 */
function SongCompactView({
  track,
  showArtwork,
  showPlayButton,
  showLikeButton,
  isLiked,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onLike,
  className,
  'data-testid': testId,
}: {
  track: Track;
  showArtwork?: boolean;
  showPlayButton?: boolean;
  showLikeButton?: boolean;
  isLiked?: boolean;
  isCurrentTrack?: boolean;
  isPlaying?: boolean;
  onPlay?: (e: React.MouseEvent) => void;
  onLike?: (e: React.MouseEvent) => void;
  className?: string;
  'data-testid'?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200",
        isCurrentTrack && "bg-purple-50",
        className
      )}
      data-testid={testId}
    >
      {showArtwork && (
        <AlbumArtwork
          src={track.imageUrl}
          alt={`${track.title} album artwork`}
          size="sm"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium truncate",
            isCurrentTrack ? "text-purple-600" : "text-gray-900"
          )}>
            {track.title}
          </h3>
          {track.isExplicit && (
            <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded">
              E
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link
            href={`/artist/${track.artist.id}`}
            className="hover:text-purple-600 hover:underline transition-colors duration-200 truncate"
          >
            {track.artist.name}
          </Link>
          <span>•</span>
          <span>{formatDuration(track.duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {showPlayButton && (
          <button
            onClick={onPlay}
            className="p-1.5 rounded-full text-gray-400 hover:text-purple-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label={isPlaying ? "Pause track" : "Play track"}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>
        )}

        {showLikeButton && (
          <button
            onClick={onLike}
            className={cn(
              "p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
              isLiked
                ? "text-red-500 hover:text-red-600"
                : "text-gray-400 hover:text-red-500"
            )}
            aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
          >
            {isLiked ? (
              <HeartIcon className="w-4 h-4" />
            ) : (
              <HeartOutlineIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * List view for track listings in albums/playlists
 */
function SongListItem({
  track,
  showTrackNumber,
  showLikeButton,
  showMoreButton,
  isLiked,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onLike,
  onMore,
  className,
  'data-testid': testId,
}: {
  track: Track;
  showTrackNumber?: boolean;
  showLikeButton?: boolean;
  showMoreButton?: boolean;
  isLiked?: boolean;
  isCurrentTrack?: boolean;
  isPlaying?: boolean;
  onPlay?: (e: React.MouseEvent) => void;
  onLike?: (e: React.MouseEvent) => void;
  onMore?: (e: React.MouseEvent) => void;
  className?: string;
  'data-testid'?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200",
        isCurrentTrack && "bg-purple-50",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={testId}
    >
      {/* Track Number / Play Button */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {isHovered || isCurrentTrack ? (
          <button
            onClick={onPlay}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label={isPlaying ? "Pause track" : "Play track"}
          >
            {isPlaying ? (
              <PauseIcon className="w-4 h-4 text-purple-600" />
            ) : (
              <PlayIcon className="w-4 h-4 text-purple-600" />
            )}
          </button>
        ) : showTrackNumber && track.trackNumber ? (
          <span className="text-sm text-gray-400 font-medium">
            {track.trackNumber}
          </span>
        ) : null}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium truncate",
            isCurrentTrack ? "text-purple-600" : "text-gray-900"
          )}>
            {track.title}
          </h4>
          {track.isExplicit && (
            <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded">
              E
            </span>
          )}
        </div>
        
        <Link
          href={`/artist/${track.artist.id}`}
          className="text-sm text-gray-500 hover:text-purple-600 hover:underline transition-colors duration-200 truncate block"
        >
          {track.artist.name}
        </Link>
      </div>

      {/* Genres (compact) */}
      <div className="hidden md:block flex-shrink-0">
        <CompactGenreDisplay
          genres={track.genres}
          maxLength={30}
        />
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {showLikeButton && (
          <button
            onClick={onLike}
            className={cn(
              "opacity-0 group-hover:opacity-100 p-1 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
              isLiked && "opacity-100",
              isLiked
                ? "text-red-500 hover:text-red-600"
                : "text-gray-400 hover:text-red-500"
            )}
            aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
          >
            {isLiked ? (
              <HeartIcon className="w-4 h-4" />
            ) : (
              <HeartOutlineIcon className="w-4 h-4" />
            )}
          </button>
        )}

        <span className="text-sm text-gray-500 w-12 text-right">
          {formatDuration(track.duration)}
        </span>

        {showMoreButton && (
          <button
            onClick={onMore}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-400 hover:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="More options"
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}