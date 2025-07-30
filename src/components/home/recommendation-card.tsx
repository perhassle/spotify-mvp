"use client";

import React, { useState } from 'react';
import { useHomeFeedStore } from '@/stores/home-feed-store';
import { usePlayerStore } from '@/stores/player-store';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/optimized-image';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  Plus,
  Info
} from 'lucide-react';
import type { RecommendationScore, Track } from '@/types';
import { dataService } from '@/lib/data/data-service';

interface RecommendationCardProps {
  recommendation: RecommendationScore;
  sectionId: string;
  _userId: string;
  size: 'small' | 'medium' | 'large' | 'hero' | 'compact' | 'list';
  showReason?: boolean;
}

export function RecommendationCard({ 
  recommendation, 
  sectionId, 
  _userId,
  size,
  showReason = false
}: RecommendationCardProps) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const { trackTrackClick, trackTrackPlay, trackTrackLike } = useHomeFeedStore();
  const { 
    currentTrack, 
    isPlaying, 
    play, 
    pause, 
    setQueue 
  } = usePlayerStore();

  // Load track data on mount
  React.useEffect(() => {
    const loadTrack = async () => {
      try {
        const trackData = await dataService.getTrack(recommendation.trackId);
        setTrack(trackData);
      } catch (error) {
        console.error('Failed to load track:', error);
      }
    };
    
    loadTrack();
  }, [recommendation.trackId]);

  const isCurrentTrack = currentTrack?.id === recommendation.trackId;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!track) return;
    
    setIsLoading(true);
    
    try {
      if (isCurrentTrack) {
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      } else {
        // Start playing this track
        setQueue([track], 0);
        play(track);
        trackTrackPlay(sectionId, recommendation.trackId);
      }
    } catch (error) {
      console.error('Failed to play track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    trackTrackLike(sectionId, recommendation.trackId);
  };

  const handleCardClick = () => {
    if (!track) return;
    trackTrackClick(sectionId, recommendation.trackId);
    // Could navigate to track detail page
  };

  if (!track) {
    return <RecommendationCardSkeleton size={size} />;
  }

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-40',
      image: 'w-40 h-40',
      title: 'text-sm',
      artist: 'text-xs',
      padding: 'p-3',
    },
    medium: {
      container: 'w-48',
      image: 'w-48 h-48',
      title: 'text-base',
      artist: 'text-sm',
      padding: 'p-4',
    },
    large: {
      container: 'w-64',
      image: 'w-64 h-64',
      title: 'text-lg',
      artist: 'text-base',
      padding: 'p-4',
    },
    hero: {
      container: 'w-full',
      image: 'w-full h-64 md:h-80',
      title: 'text-xl md:text-2xl',
      artist: 'text-base md:text-lg',
      padding: 'p-6',
    },
    compact: {
      container: 'w-full',
      image: 'w-12 h-12',
      title: 'text-sm',
      artist: 'text-xs',
      padding: 'p-2',
    },
    list: {
      container: 'w-full',
      image: 'w-10 h-10',
      title: 'text-sm',
      artist: 'text-xs',
      padding: 'p-1',
    },
  };

  const config = sizeConfig[size];

  if (size === 'compact' || size === 'list') {
    return (
      <div 
        className={`${config.container} ${config.padding} flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Play ${track.title} by ${track.artist.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePlayPause(e as unknown as React.MouseEvent);
          }
        }}
      >
        <div className="relative">
          <OptimizedImage
            src={track.imageUrl || '/images/placeholder-album.png'}
            alt={`${track.title} album cover`}
            className={`${config.image} rounded object-cover`}
            width={400}
            height={400}
          />
          
          <Button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="absolute inset-0 w-full h-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded"
            size="sm"
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isCurrentlyPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`${config.title} font-medium text-gray-900 dark:text-white truncate`}>
            {track.title}
          </h3>
          <p className={`${config.artist} text-gray-600 dark:text-gray-400 truncate`}>
            {track.artist.name}
          </p>
          {showReason && recommendation.reasons.length > 0 && recommendation.reasons[0] && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
              {recommendation.reasons[0].explanation}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={handleLike}
            variant="ghost"
            size="sm"
            className={`w-8 h-8 p-0 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${config.container} bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
        size === 'hero' ? 'overflow-hidden' : ''
      }`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Play ${track.title} by ${track.artist.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlayPause(e as unknown as React.MouseEvent);
        }
      }}
    >
      {/* Album Art with Play Button */}
      <div className="relative">
        <OptimizedImage
          src={track.imageUrl || '/images/placeholder-album.png'}
          alt={`${track.title} album cover`}
          className={`${config.image} ${size === 'hero' ? 'object-cover' : 'rounded-t-xl object-cover'}`}
          width={400}
          height={400}
        />
        
        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 p-0 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200"
            size="sm"
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isCurrentlyPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Current Playing Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            Playing
          </div>
        )}

        {/* Confidence Score (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {Math.round(recommendation.score * 100)}%
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className={config.padding}>
        <h3 className={`${config.title} font-semibold text-gray-900 dark:text-white truncate mb-1`}>
          {track.title}
        </h3>
        <p className={`${config.artist} text-gray-600 dark:text-gray-400 truncate mb-2`}>
          {track.artist.name}
        </p>

        {/* Recommendation Reason */}
        {showReason && recommendation.reasons.length > 0 && recommendation.reasons[0] && (
          <div className="flex items-start gap-1 mb-3">
            <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
              {recommendation.reasons[0].explanation}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={handleLike}
            variant="ghost"
            size="sm"
            className={`flex-1 gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{isLiked ? 'Liked' : 'Like'}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600"
            aria-label="Add to playlist"
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecommendationCardSkeleton({ size }: { size: string }) {
  const sizeConfig = {
    small: 'w-40 h-52',
    medium: 'w-48 h-64',
    large: 'w-64 h-80',
    hero: 'w-full h-96',
    compact: 'w-full h-16',
    list: 'w-full h-12',
  };

  return (
    <div className={`${sizeConfig[size as keyof typeof sizeConfig]} bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse`}>
      {size === 'compact' || size === 'list' ? (
        <div className="flex items-center gap-3 p-3 h-full">
          <div className={`${size === 'compact' ? 'w-12 h-12' : 'w-10 h-10'} bg-gray-300 dark:bg-gray-600 rounded`} />
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
          </div>
        </div>
      ) : (
        <>
          <div className={`${size === 'hero' ? 'h-64 md:h-80' : size === 'large' ? 'h-64' : size === 'medium' ? 'h-48' : 'h-40'} bg-gray-300 dark:bg-gray-600 rounded-t-xl`} />
          <div className="p-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
          </div>
        </>
      )}
    </div>
  );
}