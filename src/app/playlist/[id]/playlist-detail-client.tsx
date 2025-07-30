'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, 
  Pause, 
  Shuffle, 
  MoreHorizontal, 
  Music, 
  Lock, 
  Users,
  Share2,
  Edit3,
  Search,
  Clock,
  Plus,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import usePlaylistStore from '@/stores/playlist-store';
import usePlayerStore from '@/stores/player-store';
import { Playlist, PlaylistTrack } from '@/types';
import { formatDuration } from '@/lib/format-utils';
import DraggableTrackList from '@/components/features/playlist/draggable-track-list';

interface PlaylistDetailClientProps {
  playlistId: string;
}

export default function PlaylistDetailClient({ playlistId }: PlaylistDetailClientProps) {
  const { data: session } = useSession();
  const _router = useRouter();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [_isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [_showAddTrack, setShowAddTrack] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album' | 'dateAdded' | 'duration'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');
  
  const { 
    removeTrackFromPlaylist
  } = usePlaylistStore();
  
  const { 
    isPlaying, 
    currentTrack,
    play,
    pause,
    setQueue,
    toggleShuffle,
    shuffleMode 
  } = usePlayerStore();

  useEffect(() => {
    // In a real app, fetch playlist from API
    const fetchPlaylist = async () => {
      try {
        const response = await fetch(`/api/playlist/${playlistId}`);
        if (response.ok) {
          const playlistData = await response.json();
          setPlaylist(playlistData);
        }
      } catch (error) {
        console.error('Failed to fetch playlist:', error);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  if (!playlist) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const isOwner = session?.user?.id === playlist.owner.id;
  const isCurrentPlaylistPlaying = isPlaying && 
    playlist.tracks.some(pt => pt.track.id === currentTrack?.id);

  const filteredTracks = playlist.tracks.filter(pt =>
    !searchQuery || 
    pt.track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pt.track.artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pt.track.album.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTracks = [...filteredTracks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.track.title.localeCompare(b.track.title);
        break;
      case 'artist':
        comparison = a.track.artist.name.localeCompare(b.track.artist.name);
        break;
      case 'album':
        comparison = a.track.album.title.localeCompare(b.track.album.title);
        break;
      case 'dateAdded':
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        break;
      case 'duration':
        comparison = a.track.duration - b.track.duration;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handlePlayPause = () => {
    if (playlist.tracks.length === 0) return;
    
    if (isCurrentPlaylistPlaying) {
      pause();
    } else {
      const tracks = playlist.tracks.map(pt => pt.track);
      setQueue(tracks, 0);
      play(tracks[0]);
    }
  };

  const handlePlayTrack = (track: PlaylistTrack, index: number) => {
    const tracks = sortedTracks.map(pt => pt.track);
    setQueue(tracks, index);
    play(track.track);
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await removeTrackFromPlaylist(playlist.id, trackId);
      // Update local state
      setPlaylist(prev => prev ? {
        ...prev,
        tracks: prev.tracks.filter(pt => pt.track.id !== trackId),
        trackCount: prev.trackCount - 1
      } : null);
    } catch (error) {
      console.error('Failed to remove track:', error);
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const clearSelection = () => {
    setSelectedTracks([]);
  };

  const _formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalDuration = playlist.tracks.reduce((sum, pt) => sum + pt.track.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black text-white">
      {/* Hero Section */}
      <div className="relative px-6 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-6 md:space-y-0 md:space-x-6">
            {/* Playlist Cover */}
            <div className="w-64 h-64 rounded-lg shadow-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
              {playlist.imageUrl ? (
                <Image
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                  <Music className="w-24 h-24 text-white/50" />
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-white/70">PLAYLIST</span>
                {!playlist.isPublic && <Lock className="w-4 h-4 text-white/70" />}
                {playlist.collaborative && <Users className="w-4 h-4 text-white/70" />}
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 leading-none">
                {playlist.name}
              </h1>

              {playlist.description && (
                <p className="text-white/70 text-lg mb-4 max-w-2xl">
                  {playlist.description}
                </p>
              )}

              <div className="flex items-center space-x-2 text-sm text-white/70">
                <Image
                  src={playlist.owner.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop&crop=face'}
                  alt={playlist.owner.displayName}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium text-white">
                  {playlist.owner.displayName}
                </span>
                <span>•</span>
                <span>{playlist.trackCount} songs</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </>
                )}
              </div>

              {/* Tags */}
              {playlist.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {playlist.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <Button
                onClick={handlePlayPause}
                disabled={playlist.tracks.length === 0}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 transition-all"
              >
                {isCurrentPlaylistPlaying ? (
                  <Pause className="w-6 h-6 text-black fill-current" />
                ) : (
                  <Play className="w-6 h-6 text-black fill-current ml-0.5" />
                )}
              </Button>

              {/* Shuffle Button */}
              <Button
                onClick={toggleShuffle}
                variant="ghost"
                className={`text-2xl ${shuffleMode ? 'text-green-500' : 'text-white/70 hover:text-white'}`}
              >
                <Shuffle className="w-6 h-6" />
              </Button>

              {/* More Options */}
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white"
              >
                <MoreHorizontal className="w-6 h-6" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {selectedTracks.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-zinc-800 rounded-full mr-4">
                  <span className="text-sm">{selectedTracks.length} selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs h-6 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setShowAddTrack(true)}
                className="border-zinc-600 text-white hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add songs
              </Button>

              <Button
                variant="ghost"
                className="text-white/70 hover:text-white"
              >
                <Share2 className="w-5 h-5" />
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="text-white/70 hover:text-white"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search in playlist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex border border-zinc-600 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-none ${
                    viewMode === 'list' 
                      ? 'bg-zinc-700 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className={`rounded-none ${
                    viewMode === 'compact' 
                      ? 'bg-zinc-700 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          {sortedTracks.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No songs found' : 'No songs in this playlist'}
              </h3>
              <p className="text-zinc-400 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : "Let's find some music for your playlist"
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowAddTrack(true)}
                  className="bg-green-500 hover:bg-green-600 text-black font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add songs
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Track List Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-800 mb-2">
                <div className="col-span-1">#</div>
                <div className="col-span-5">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Title</span>
                    {sortBy === 'title' && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2 hidden md:block">
                  <button
                    onClick={() => handleSort('album')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Album</span>
                    {sortBy === 'album' && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2 hidden lg:block">
                  <button
                    onClick={() => handleSort('dateAdded')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Date Added</span>
                    {sortBy === 'dateAdded' && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('duration')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <Clock className="w-3 h-3" />
                    {sortBy === 'duration' && (
                      sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </div>
              </div>

              {/* Track Items with Drag & Drop */}
              <DraggableTrackList
                playlistId={playlist.id}
                tracks={sortedTracks}
                isOwner={isOwner}
                selectedTracks={selectedTracks}
                onTrackSelect={toggleTrackSelection}
                onPlayTrack={handlePlayTrack}
                onRemoveTrack={handleRemoveTrack}
                showSelection={selectedTracks.length > 0}
              />
            </>
          )}
        </div>
      </div>

      {/* Footer Spacing */}
      <div className="h-32" />
    </div>
  );
}