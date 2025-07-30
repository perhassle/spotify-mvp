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
  ChartBarIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { 
  formatDuration, 
  formatDate, 
  formatPopularity,
  formatNumberShort
} from '@/lib/format-utils';
import { AlbumArtwork, ArtistPhoto } from '@/components/common/optimized-image';
import { GenreTags } from '@/components/common/genre-tags';
import { SongMetadata } from '@/components/features/metadata/song-metadata';
import { usePlayerStore } from '@/stores/player-store';
import type { Track } from '@/types';

interface TrackDetails extends Track {
  relatedTracks: Track[];
  albumTracks: Track[];
  artistTopTracks: Track[];
}

interface TrackDetailClientProps {
  track: TrackDetails;
}

/**
 * Client-side track detail component with related content
 */
export default function TrackDetailClient({ track }: TrackDetailClientProps) {
  const { currentTrack, isPlaying, play, pause, setQueue } = usePlayerStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayTrack = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      play(track);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleLikeRelatedTrack = (trackId: string) => {
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${track.title} by ${track.artist.name}`,
        text: `Check out this track: ${track.title} by ${track.artist.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white">
      {/* Track Header */}
      <div className="relative px-6 pt-20 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 lg:gap-8">
            {/* Album Artwork */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative">
                <AlbumArtwork
                  src={track.imageUrl}
                  alt={`${track.title} album artwork`}
                  size="xl"
                  priority
                  className="shadow-2xl"
                />
                
                {/* Large Play Button Overlay */}
                <button
                  onClick={handlePlayTrack}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md opacity-0 hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-900"
                  aria-label={isCurrentlyPlaying ? "Pause track" : "Play track"}
                >
                  {isCurrentlyPlaying ? (
                    <PauseIcon className="w-20 h-20 text-white" />
                  ) : (
                    <PlayIcon className="w-20 h-20 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Track Information */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-wide text-purple-200">
                  Song
                </p>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight">
                  {track.title}
                  {track.isExplicit && (
                    <span className="ml-4 text-lg bg-gray-400 text-black px-3 py-1 rounded">
                      E
                    </span>
                  )}
                </h1>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xl">
                  <Link
                    href={`/artist/${track.artist.id}`}
                    className="font-semibold hover:underline transition-colors duration-200"
                  >
                    {track.artist.name}
                  </Link>
                  <span>•</span>
                  <Link
                    href={`/album/${track.album.id}`}
                    className="text-purple-200 hover:text-white hover:underline transition-colors duration-200"
                  >
                    {track.album.title}
                  </Link>
                  <span>•</span>
                  <span className="text-purple-200">
                    {formatDate(track.releaseDate, 'year')}
                  </span>
                </div>
              </div>

              {/* Genres */}
              {track.genres.length > 0 && (
                <GenreTags
                  genres={track.genres}
                  maxTags={4}
                  size="md"
                  variant="subtle"
                  className="justify-center lg:justify-start"
                />
              )}

              {/* Track Stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-purple-200">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatDuration(track.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(track.releaseDate, 'long')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>{formatPopularity(track.popularity)} popularity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handlePlayTrack}
              className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full hover:bg-green-400 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label={isCurrentlyPlaying ? "Pause track" : "Play track"}
            >
              {isCurrentlyPlaying ? (
                <PauseIcon className="w-6 h-6 text-black" />
              ) : (
                <PlayIcon className="w-6 h-6 text-black ml-1" />
              )}
            </button>

            <button
              onClick={handleLike}
              className={cn(
                "p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900",
                isLiked
                  ? "text-green-500 hover:text-green-400"
                  : "text-gray-400 hover:text-white"
              )}
              aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
            >
              {isLiked ? (
                <HeartIcon className="w-8 h-8" />
              ) : (
                <HeartOutlineIcon className="w-8 h-8" />
              )}
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label="Share track"
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

      {/* Track Details & Credits */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Track Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Artist</h3>
                <Link
                  href={`/artist/${track.artist.id}`}
                  className="flex items-center gap-3 hover:text-purple-300 transition-colors duration-200"
                >
                  <ArtistPhoto
                    src={track.artist.imageUrl}
                    alt={`${track.artist.name} photo`}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{track.artist.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatNumberShort(track.artist.followers)} followers
                    </p>
                  </div>
                </Link>
              </div>

              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Album</h3>
                <Link
                  href={`/album/${track.album.id}`}
                  className="flex items-center gap-3 hover:text-purple-300 transition-colors duration-200"
                >
                  <AlbumArtwork
                    src={track.album.imageUrl}
                    alt={`${track.album.title} album artwork`}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{track.album.title}</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(track.album.releaseDate, 'year')} • {track.album.totalTracks} tracks
                    </p>
                  </div>
                </Link>
              </div>

              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Duration</h3>
                <p className="text-2xl font-bold">{formatDuration(track.duration)}</p>
                <p className="text-sm text-gray-400">Length</p>
              </div>

              <div>
                <h3 className="font-semibold text-purple-300 mb-2">Popularity</h3>
                <p className="text-2xl font-bold">{formatPopularity(track.popularity)}</p>
                <p className="text-sm text-gray-400">Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More from Album */}
      {track.albumTracks.length > 0 && (
        <div className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">More from {track.album.title}</h2>
                <Link
                  href={`/album/${track.album.id}`}
                  className="text-purple-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Show all
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {track.albumTracks.slice(0, 4).map((albumTrack) => (
                  <SongMetadata
                    key={albumTrack.id}
                    track={albumTrack}
                    variant="compact"
                    showArtwork={true}
                    showGenres={false}
                    isLiked={likedTracks.has(albumTrack.id)}
                    onLike={() => handleLikeRelatedTrack(albumTrack.id)}
                    className="bg-white/5 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More from Artist */}
      {track.artistTopTracks.length > 0 && (
        <div className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">More from {track.artist.name}</h2>
                <Link
                  href={`/artist/${track.artist.id}`}
                  className="text-purple-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  Show all
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {track.artistTopTracks.slice(0, 4).map((artistTrack) => (
                  <SongMetadata
                    key={artistTrack.id}
                    track={artistTrack}
                    variant="compact"
                    showArtwork={true}
                    showGenres={false}
                    isLiked={likedTracks.has(artistTrack.id)}
                    onLike={() => handleLikeRelatedTrack(artistTrack.id)}
                    className="bg-white/5 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Tracks */}
      {track.relatedTracks.length > 0 && (
        <div className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">You might also like</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {track.relatedTracks.slice(0, 6).map((relatedTrack) => (
                  <SongMetadata
                    key={relatedTrack.id}
                    track={relatedTrack}
                    variant="compact"
                    showArtwork={true}
                    showGenres={false}
                    isLiked={likedTracks.has(relatedTrack.id)}
                    onLike={() => handleLikeRelatedTrack(relatedTrack.id)}
                    className="bg-white/5 rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}