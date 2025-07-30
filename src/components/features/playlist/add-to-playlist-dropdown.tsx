'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Music, 
  Check, 
  Search, 
  Heart,
  Lock,
  Users,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import usePlaylistStore from '@/stores/playlist-store';
import CreatePlaylistModal from './create-playlist-modal';
import { Playlist } from '@/types';

interface AddToPlaylistDropdownProps {
  trackId: string;
  trackTitle?: string;
  children?: React.ReactNode;
  onSuccess?: (playlistId: string) => void;
}

export default function AddToPlaylistDropdown({ 
  trackId, 
  trackTitle,
  children,
  onSuccess 
}: AddToPlaylistDropdownProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  
  const { 
    getUserPlaylists,
    addTrackToPlaylist,
    isLoading 
  } = usePlaylistStore();

  const userPlaylists = session?.user ? getUserPlaylists(session.user.id) : [];
  
  const filteredPlaylists = userPlaylists.filter(playlist =>
    !searchQuery || 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentPlaylists = filteredPlaylists
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  // Check if track is already in playlist
  const isTrackInPlaylist = (playlist: Playlist) => {
    return playlist.tracks.some(pt => pt.track.id === trackId);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!session?.user || addingToPlaylist === playlistId) return;
    
    setAddingToPlaylist(playlistId);
    try {
      await addTrackToPlaylist(playlistId, trackId);
      onSuccess?.(playlistId);
      
      // Show success feedback
      setTimeout(() => {
        setAddingToPlaylist(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      setAddingToPlaylist(null);
    }
  };

  const handleCreatePlaylistSuccess = (playlistId: string) => {
    setIsCreateModalOpen(false);
    handleAddToPlaylist(playlistId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-add-to-playlist]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  if (!session?.user) {
    return null; // Don't show if user is not logged in
  }

  return (
    <div className="relative" data-add-to-playlist>
      {/* Trigger Button */}
      {children ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {children}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to playlist
          <ChevronDown className="w-3 h-3 ml-2" />
        </Button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-semibold text-white mb-2">Add to playlist</h3>
            {trackTitle && (
              <p className="text-sm text-zinc-400 truncate">&quot;{trackTitle}&quot;</p>
            )}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Find a playlist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 text-sm"
              />
            </div>
          </div>

          {/* Create New Playlist */}
          <div className="p-2 border-b border-zinc-800">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-zinc-700 rounded flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">Create playlist</p>
                <p className="text-sm text-zinc-400">Make a new playlist</p>
              </div>
            </button>
          </div>

          {/* Liked Songs (Special Playlist) */}
          <div className="p-2 border-b border-zinc-800">
            <button
              onClick={() => handleAddToPlaylist('liked-songs')}
              disabled={addingToPlaylist === 'liked-songs'}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-white">Liked Songs</p>
                <p className="text-sm text-zinc-400">Your favorite tracks</p>
              </div>
              {addingToPlaylist === 'liked-songs' ? (
                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
              ) : (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </button>
          </div>

          {/* User Playlists */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : recentPlaylists.length === 0 ? (
              <div className="p-4 text-center">
                <Music className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">
                  {searchQuery ? 'No playlists found' : 'No playlists yet'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-green-400 hover:text-green-300"
                  >
                    Create your first playlist
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-2">
                {recentPlaylists.map((playlist) => {
                  const isAdded = isTrackInPlaylist(playlist);
                  const isAdding = addingToPlaylist === playlist.id;
                  
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => !isAdded && handleAddToPlaylist(playlist.id)}
                      disabled={isAdded || isAdding}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                        ${isAdded 
                          ? 'bg-green-500/10 cursor-default' 
                          : 'hover:bg-zinc-800 cursor-pointer'
                        }
                        ${isAdding ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Playlist Cover */}
                      <div className="w-10 h-10 rounded bg-zinc-700 overflow-hidden flex-shrink-0 relative">
                        {playlist.imageUrl ? (
                          <Image
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-zinc-500" />
                          </div>
                        )}
                      </div>

                      {/* Playlist Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium truncate ${isAdded ? 'text-green-400' : 'text-white'}`}>
                            {playlist.name}
                          </p>
                          {!playlist.isPublic && (
                            <Lock className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                          )}
                          {playlist.collaborative && (
                            <Users className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 truncate">
                          {playlist.trackCount} songs
                          {playlist.description && ` • ${playlist.description}`}
                        </p>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {isAdding ? (
                          <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                        ) : isAdded ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Plus className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Show All Playlists Link */}
          {recentPlaylists.length >= 8 && (
            <div className="p-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to playlists page with search
                }}
                className="w-full text-sm text-zinc-400 hover:text-white text-center"
              >
                Show all playlists ({userPlaylists.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreatePlaylistSuccess}
      />
    </div>
  );
}