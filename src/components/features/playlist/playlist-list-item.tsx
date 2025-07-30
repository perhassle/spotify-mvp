'use client';

import { useState } from 'react';
import Image from 'next/image';
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

interface PlaylistListItemProps {
  playlist: Playlist;
  index: number;
}

export default function PlaylistListItem({ playlist, index }: PlaylistListItemProps) {
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

  const handleRowClick = () => {
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
    return count.toLocaleString();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div
      className={`
        group grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
        hover:bg-zinc-800/50 ${isSelected ? 'bg-zinc-800 ring-1 ring-green-500' : ''}
      `}
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Playlist Info */}
      <div className="col-span-6 flex items-center space-x-3 min-w-0">
        {/* Selection Checkbox */}
        {selectedPlaylists.length > 0 ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => togglePlaylistSelection(playlist.id)}
            className="w-4 h-4 text-green-500 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          /* Play/Pause Button */
          <div className="w-4 h-4 flex-shrink-0">
            {playlist.tracks.length > 0 && (isHovered || isCurrentPlaylistPlaying) ? (
              <Button
                onClick={handlePlayPause}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 hover:bg-transparent"
              >
                {isCurrentPlaylistPlaying ? (
                  <Pause className="w-4 h-4 text-white fill-current" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-current" />
                )}
              </Button>
            ) : (
              <span className="text-zinc-500 text-sm font-mono">
                {(index + 1).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        )}

        {/* Cover Image */}
        <div className="w-12 h-12 rounded bg-zinc-800 flex-shrink-0 overflow-hidden relative">
          {playlist.imageUrl ? (
            <Image
              src={playlist.imageUrl}
              alt={playlist.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-6 h-6 text-zinc-500" />
            </div>
          )}
        </div>

        {/* Playlist Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className={`
              font-medium truncate text-sm
              ${isCurrentPlaylistPlaying ? 'text-green-400' : 'text-white'}
            `}>
              {playlist.name}
            </h3>
            
            {/* Privacy Indicators */}
            <div className="flex space-x-1 flex-shrink-0">
              {!playlist.isPublic && (
                <Lock className="w-3 h-3 text-zinc-500" />
              )}
              {playlist.collaborative && (
                <Users className="w-3 h-3 text-zinc-500" />
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
            <span>By {playlist.owner.displayName}</span>
            {playlist.description && (
              <>
                <span>•</span>
                <span className="truncate">{playlist.description}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {playlist.tags.length > 0 && (
            <div className="flex space-x-1 mt-1">
              {playlist.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Track Count */}
      <div className="col-span-2 hidden sm:flex items-center">
        <span className="text-sm text-zinc-400">
          {formatTrackCount(playlist.trackCount)}
        </span>
      </div>

      {/* Duration */}
      <div className="col-span-2 hidden md:flex items-center">
        <span className="text-sm text-zinc-400">
          {playlist.totalDuration > 0 ? formatDuration(playlist.totalDuration) : '-'}
        </span>
      </div>

      {/* Last Modified */}
      <div className="col-span-2 hidden lg:flex items-center">
        <span className="text-sm text-zinc-400">
          {formatDate(new Date(playlist.updatedAt))}
        </span>
      </div>

      {/* Menu Button */}
      <div className="col-span-0 flex items-center justify-end relative">
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
  );
}