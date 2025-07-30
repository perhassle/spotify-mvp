'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PlayIcon, 
  PauseIcon, 
  HeartIcon, 
  EllipsisHorizontalIcon,
  ShareIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { 
  formatDuration, 
  formatDate, 
  formatNumberShort, 
  calculateTotalDuration,
  formatTrackNumber 
} from '@/lib/format-utils';
import { AlbumArtwork } from '@/components/common/optimized-image';
import { GenreTags } from '@/components/common/genre-tags';
import { usePlayerStore } from '@/stores/player-store';
import type { Album, Track } from '@/types';

interface AlbumDetails extends Album {
  tracks: Track[];
  totalDuration: number;
  averagePopularity: number;
}

interface AlbumDetailClientProps {
  album: AlbumDetails;
}

/**
 * Client-side album detail component with interactive features
 */
export default function AlbumDetailClient({ album }: AlbumDetailClientProps) {
  const { currentTrack, isPlaying, play, pause, setQueue } = usePlayerStore();
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [isLikedAlbum, setIsLikedAlbum] = useState(false);

  const isCurrentAlbumPlaying = album.tracks.some(track => 
    currentTrack?.id === track.id && isPlaying
  );

  const handlePlayAlbum = () => {
    if (album.tracks.length === 0) return;

    if (isCurrentAlbumPlaying) {
      pause();
    } else {
      setQueue(album.tracks, 0);
      play(album.tracks[0]);
    }
  };

  const handlePlayTrack = (track: Track, trackIndex: number) => {
    setQueue(album.tracks, trackIndex);
    play(track);
  };

  const handleLikeTrack = (trackId: string) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const handleLikeAlbum = () => {
    setIsLikedAlbum(!isLikedAlbum);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${album.title} by ${album.artist.name}`,
        text: `Check out this album: ${album.title} by ${album.artist.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white">
      {/* Album Header */}
      <div className="relative px-6 pt-20 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 lg:gap-8">
            {/* Album Artwork */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <AlbumArtwork
                src={album.imageUrl || '/images/placeholder-album.png'}
                alt={`${album.title} album artwork`}
                size="xl"
                priority
                className="shadow-2xl"
              />
            </div>

            {/* Album Information */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-wide text-purple-200">
                  {album.type}
                </p>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight">
                  {album.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-lg">
                  <Link
                    href={`/artist/${album.artist.id}`}
                    className="font-semibold hover:underline transition-colors duration-200"
                  >
                    {album.artist.name}
                  </Link>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-purple-200">
                    {formatDate(album.releaseDate, 'year')}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-purple-200">
                    {album.totalTracks} {album.totalTracks === 1 ? 'track' : 'tracks'}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-purple-200">
                    {formatDuration(calculateTotalDuration(album.tracks))}
                  </span>
                </div>
              </div>

              {/* Genres */}
              {album.genres.length > 0 && (
                <GenreTags
                  genres={album.genres}
                  maxTags={4}
                  size="md"
                  variant="subtle"
                  className="justify-center lg:justify-start"
                />
              )}

              {/* Album Stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-purple-200">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Released {formatDate(album.releaseDate, 'long')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatDuration(calculateTotalDuration(album.tracks))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handlePlayAlbum}
              className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full hover:bg-green-400 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label={isCurrentAlbumPlaying ? "Pause album" : "Play album"}
            >
              {isCurrentAlbumPlaying ? (
                <PauseIcon className="w-6 h-6 text-black" />
              ) : (
                <PlayIcon className="w-6 h-6 text-black ml-1" />
              )}
            </button>

            <button
              onClick={handleLikeAlbum}
              className={cn(
                "p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900",
                isLikedAlbum
                  ? "text-green-500 hover:text-green-400"
                  : "text-gray-400 hover:text-white"
              )}
              aria-label={isLikedAlbum ? "Remove from library" : "Add to library"}
            >
              {isLikedAlbum ? (
                <HeartIcon className="w-8 h-8" />
              ) : (
                <HeartOutlineIcon className="w-8 h-8" />
              )}
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label="Share album"
            >
              <ShareIcon className="w-8 h-8" />
            </button>

            <button
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label="More options"
            >
              <EllipsisHorizontalIcon className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Track Listing */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
            {/* Track List Header */}
            <div className="grid grid-cols-[40px_1fr_1fr_60px] lg:grid-cols-[40px_1fr_200px_100px_60px] gap-4 px-4 py-2 text-sm text-gray-400 font-medium border-b border-gray-700 mb-4">
              <div className="text-center">#</div>
              <div>Title</div>
              <div className="hidden lg:block">Album</div>
              <div className="text-center">
                <ClockIcon className="w-4 h-4 mx-auto" />
              </div>
              <div></div>
            </div>

            {/* Track List */}
            <div className="space-y-1">
              {album.tracks.map((track, index) => (
                <TrackListItem
                  key={track.id}
                  track={track}
                  trackIndex={index}
                  totalTracks={album.totalTracks}
                  isLiked={likedTracks.has(track.id)}
                  onPlay={() => handlePlayTrack(track, index)}
                  onLike={() => handleLikeTrack(track.id)}
                />
              ))}
            </div>

            {/* Album Footer Info */}
            <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-gray-400">
              <p>
                Released {formatDate(album.releaseDate, 'long')} • {album.totalTracks} tracks • {formatDuration(calculateTotalDuration(album.tracks))}
              </p>
              {album.genres.length > 0 && (
                <p className="mt-2">
                  Genres: {album.genres.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Artist Section */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Artist</h2>
            <Link
              href={`/artist/${album.artist.id}`}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold group-hover:text-purple-300 transition-colors duration-200">
                  {album.artist.name}
                </h3>
                <p className="text-gray-400">
                  {formatNumberShort(album.artist.followers)} followers
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual track list item component
 */
interface TrackListItemProps {
  track: Track;
  trackIndex: number;
  totalTracks: number;
  isLiked: boolean;
  onPlay: () => void;
  onLike: () => void;
}

function TrackListItem({ 
  track, 
  trackIndex, 
  totalTracks,
  isLiked, 
  onPlay, 
  onLike 
}: TrackListItemProps) {
  const { currentTrack, isPlaying } = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  return (
    <div
      className={cn(
        "group grid grid-cols-[40px_1fr_1fr_60px] lg:grid-cols-[40px_1fr_200px_100px_60px] gap-4 px-4 py-3 rounded-md hover:bg-white/10 transition-colors duration-200",
        isCurrentTrack && "bg-white/10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Track Number / Play Button */}
      <div className="flex items-center justify-center">
        {isHovered || isCurrentTrack ? (
          <button
            onClick={onPlay}
            className="w-6 h-6 flex items-center justify-center text-white hover:text-green-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            aria-label={isCurrentlyPlaying ? "Pause track" : "Play track"}
          >
            {isCurrentlyPlaying ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className={cn(
            "text-sm font-medium",
            isCurrentTrack ? "text-green-400" : "text-gray-400"
          )}>
            {formatTrackNumber(trackIndex + 1, totalTracks)}
          </span>
        )}
      </div>

      {/* Track Info */}
      <div className="flex items-center min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "font-medium truncate",
              isCurrentTrack ? "text-green-400" : "text-white"
            )}>
              {track.title}
            </h4>
            {track.isExplicit && (
              <span className="text-xs bg-gray-400 text-black px-1.5 py-0.5 rounded">
                E
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 truncate">
            {track.artist.name}
          </p>
        </div>
      </div>

      {/* Album (hidden on mobile) */}
      <div className="hidden lg:flex items-center">
        <span className="text-sm text-gray-400 truncate">
          {track.album.title}
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center justify-center">
        <span className="text-sm text-gray-400">
          {formatDuration(track.duration)}
        </span>
      </div>

      {/* Like Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={onLike}
          className={cn(
            "opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black",
            isLiked && "opacity-100",
            isLiked
              ? "text-green-500 hover:text-green-400"
              : "text-gray-400 hover:text-white"
          )}
          aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
        >
          {isLiked ? (
            <HeartIcon className="w-4 h-4" />
          ) : (
            <HeartOutlineIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}