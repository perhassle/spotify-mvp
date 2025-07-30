'use client';

import React from 'react';
import { Play, Pause, Heart, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddToPlaylistDropdown from '@/components/features/playlist/add-to-playlist-dropdown';
import usePlayerStore from '@/stores/player-store';
import { Track } from '@/types';
import { formatDuration } from '@/lib/format-utils';

interface TrackCardWithPlaylistProps {
  track: Track;
  index?: number;
  onPlay?: (track: Track) => void;
}

export default function TrackCardWithPlaylist({ 
  track, 
  index, 
  onPlay 
}: TrackCardWithPlaylistProps) {
  const { 
    isPlaying, 
    currentTrack, 
    play, 
    pause 
  } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        play(track);
      }
    } else {
      play(track);
      onPlay?.(track);
    }
  };

  return (
    <div className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
      {/* Index/Play Button */}
      <div className="w-8 flex items-center justify-center">
        {index !== undefined && !isCurrentTrackPlaying ? (
          <span className="text-sm text-zinc-400 group-hover:hidden">
            {index + 1}
          </span>
        ) : null}
        
        {isCurrentTrackPlaying ? (
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-1 h-3 bg-green-500 animate-pulse mr-0.5"></div>
            <div className="w-1 h-2 bg-green-500 animate-pulse delay-75 mr-0.5"></div>
            <div className="w-1 h-4 bg-green-500 animate-pulse delay-150"></div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className={`w-8 h-8 p-0 ${
              index !== undefined 
                ? 'opacity-0 group-hover:opacity-100' 
                : 'opacity-100'
            }`}
          >
            <Play className="w-4 h-4 text-white fill-current" />
          </Button>
        )}
      </div>

      {/* Track Image */}
      <div className="w-12 h-12 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
        <img
          src={track.album.imageUrl || track.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=48&h=48&fit=crop'}
          alt={track.album.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${
          isCurrentTrack ? 'text-green-400' : 'text-white'
        }`}>
          {track.title}
        </h4>
        <p className="text-sm text-zinc-400 truncate">
          {track.artist.name}
        </p>
      </div>

      {/* Album */}
      <div className="hidden md:block min-w-0 max-w-xs">
        <p className="text-sm text-zinc-400 truncate hover:text-white cursor-pointer">
          {track.album.title}
        </p>
      </div>

      {/* Duration */}
      <div className="text-sm text-zinc-400 w-12 text-right">
        {formatDuration(track.duration)}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 text-zinc-400 hover:text-white"
        >
          <Heart className="w-4 h-4" />
        </Button>

        {/* Add to Playlist */}
        <AddToPlaylistDropdown 
          trackId={track.id} 
          trackTitle={track.title}
          onSuccess={(playlistId) => {
            // Optional: Show success message
            console.log(`Added "${track.title}" to playlist ${playlistId}`);
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-zinc-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </AddToPlaylistDropdown>

        {/* More Options */}
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 text-zinc-400 hover:text-white"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}