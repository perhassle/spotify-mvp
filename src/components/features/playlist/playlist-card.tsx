'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Pause, 
  MoreHorizontal, 
  Music, 
  Lock, 
  Users,
  Share2,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePlaylistStore from '@/stores/playlist-store';
import usePlayerStore from '@/stores/player-store';
import { Playlist } from '@/types';
import { formatDuration } from '@/lib/format-utils';

interface PlaylistCardProps {
  playlist: Playlist;
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { 
    togglePlaylistSelection, 
    selectedPlaylists,
    deletePlaylist,
    duplicatePlaylist 
  } = usePlaylistStore();
  
  const { 
    isPlaying, 
    currentTrack,
    play,
    pause,
    setQueue 
  } = usePlayerStore();

  const isSelected = selectedPlaylists.includes(playlist.id);
  const isCurrentPlaylistPlaying = isPlaying && 
    playlist.tracks.some(pt => pt.track.id === currentTrack?.id);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playlist.tracks.length === 0) return;
    
    if (isCurrentPlaylistPlaying) {
      pause();
    } else {
      // Set playlist as queue and play first track
      const tracks = playlist.tracks.map(pt => pt.track);
      setQueue(tracks, 0);
      play(tracks[0]);
    }
  };

  const handleCardClick = () => {
    if (selectedPlaylists.length > 0) {
      togglePlaylistSelection(playlist.id);
    } else {
      router.push(`/playlist/${playlist.id}`);
    }
  };

  const handleMenuAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        router.push(`/playlist/${playlist.id}/edit`);
        break;
      case 'duplicate':
        duplicatePlaylist(playlist.id);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this playlist?')) {
          deletePlaylist(playlist.id);
        }
        break;
      case 'share':
        // Handle sharing
        break;
    }
  };

  const formatTrackCount = (count: number) => {
    return `${count} song${count !== 1 ? 's' : ''}`;
  };

  return (
    <div
      className={`
        group relative bg-zinc-900 rounded-lg p-4 transition-all duration-200 cursor-pointer
        hover:bg-zinc-800 ${isSelected ? 'ring-2 ring-green-500' : ''}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-zinc-800">
        {playlist.imageUrl ? (
          <img
            src={playlist.imageUrl}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-zinc-500" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        {playlist.tracks.length > 0 && (
          <div className={`
            absolute bottom-2 right-2 transition-all duration-200
            ${isHovered || isCurrentPlaylistPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}>
            <Button
              onClick={handlePlayPause}
              className={`
                w-12 h-12 rounded-full shadow-lg hover:scale-105 transition-transform
                ${isCurrentPlaylistPlaying 
                  ? 'bg-green-500 hover:bg-green-400' 
                  : 'bg-green-500 hover:bg-green-400'
                }
              `}
            >
              {isCurrentPlaylistPlaying ? (
                <Pause className="w-5 h-5 text-black fill-current" />
              ) : (
                <Play className="w-5 h-5 text-black fill-current ml-0.5" />
              )}
            </Button>
          </div>
        )}

        {/* Privacy Indicator */}
        <div className="absolute top-2 left-2 flex space-x-1">
          {!playlist.isPublic && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-1">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}
          {playlist.collaborative && (
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-1">
              <Users className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Selection Checkbox */}
        {selectedPlaylists.length > 0 && (
          <div className="absolute top-2 right-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => togglePlaylistSelection(playlist.id)}
              className="w-4 h-4 text-green-500 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      {/* Playlist Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-white truncate group-hover:text-green-400 transition-colors">
          {playlist.name}
        </h3>
        
        <div className="text-sm text-zinc-400 space-y-1">
          <p className="truncate">
            By {playlist.owner.displayName}
          </p>
          
          {playlist.description && (
            <p className="truncate text-xs">
              {playlist.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs">
              {formatTrackCount(playlist.trackCount)}
            </span>
            
            {playlist.totalDuration > 0 && (
              <span className="text-xs">
                {formatDuration(playlist.totalDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {playlist.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {playlist.tags.length > 2 && (
              <span className="px-2 py-1 bg-zinc-700 text-zinc-400 text-xs rounded-full">
                +{playlist.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`
              w-8 h-8 p-0 transition-opacity
              ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'}
              text-zinc-400 hover:text-white hover:bg-zinc-700
            `}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20">
              <button
                onClick={(e) => handleMenuAction('edit', e)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 rounded-t-lg flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit details</span>
              </button>
              
              <button
                onClick={(e) => handleMenuAction('duplicate', e)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>Duplicate playlist</span>
              </button>
              
              <button
                onClick={(e) => handleMenuAction('share', e)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share playlist</span>
              </button>
              
              <div className="border-t border-zinc-700 my-1" />
              
              <button
                onClick={(e) => handleMenuAction('delete', e)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 rounded-b-lg flex items-center space-x-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete playlist</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}