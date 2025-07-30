'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Pause, 
  Shuffle, 
  Search, 
  Heart,
  Clock,
  Download,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  X,
  Music,
  Filter,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import usePlayerStore from '@/stores/player-store';
import { Track } from '@/types';
import { formatDuration } from '@/lib/format-utils';

// Mock liked songs data - in a real app this would come from the API
const mockLikedSongs: (Track & { likedAt: Date })[] = [
  {
    id: 'track-1',
    title: 'Anti-Hero',
    artist: {
      id: 'artist-1',
      name: 'Taylor Swift',
      bio: 'American singer-songwriter',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
      genres: ['Pop'],
      followers: 89500000,
      isVerified: true,
      popularity: 95,
    },
    album: {
      id: 'album-1',
      title: 'Midnights',
      artist: {
        id: 'artist-1',
        name: 'Taylor Swift',
        bio: 'American singer-songwriter',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
        genres: ['Pop'],
        followers: 89500000,
        isVerified: true,
        popularity: 95,
      },
      releaseDate: new Date('2022-10-21'),
      totalTracks: 13,
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      genres: ['Pop'],
      type: 'album' as const,
    },
    duration: 200,
    previewUrl: '/audio/track-1.mp3',
    streamUrl: '/audio/track-1.mp3',
    isExplicit: false,
    popularity: 98,
    trackNumber: 3,
    genres: ['Pop'],
    releaseDate: new Date('2022-10-21'),
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    likedAt: new Date('2024-01-15T14:30:00.000Z'),
  },
  // Add more mock liked songs here...
];

export default function LikedSongsClient() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [likedSongs, setLikedSongs] = useState<(Track & { likedAt: Date })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'likedAt' | 'title' | 'artist' | 'album' | 'duration'>('likedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list');
  const [isLoading, setIsLoading] = useState(true);
  
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
    // Simulate loading
    const timer = setTimeout(() => {
      setLikedSongs(mockLikedSongs);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!session?.user) {
    router.push('/auth/login');
    return null;
  }

  const isCurrentPlaylistPlaying = isPlaying && 
    likedSongs.some(song => song.id === currentTrack?.id);

  const filteredSongs = likedSongs.filter(song =>
    !searchQuery || 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        comparison = a.artist.name.localeCompare(b.artist.name);
        break;
      case 'album':
        comparison = a.album.title.localeCompare(b.album.title);
        break;
      case 'likedAt':
        comparison = new Date(a.likedAt).getTime() - new Date(b.likedAt).getTime();
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handlePlayPause = () => {
    if (likedSongs.length === 0) return;
    
    if (isCurrentPlaylistPlaying) {
      pause();
    } else {
      const tracks = sortedSongs.map(song => ({
        ...song,
        likedAt: undefined
      }));
      setQueue(tracks, 0);
      play(tracks[0]);
    }
  };

  const handlePlayTrack = (track: Track, index: number) => {
    const tracks = sortedSongs.map(song => ({
      ...song,
      likedAt: undefined
    }));
    setQueue(tracks, index);
    play(track);
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleUnlike = (trackId: string) => {
    setLikedSongs(prev => prev.filter(song => song.id !== trackId));
    setSelectedTracks(prev => prev.filter(id => id !== trackId));
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

  const handleBulkUnlike = () => {
    if (!confirm(`Remove ${selectedTracks.length} songs from Liked Songs?`)) return;
    
    setLikedSongs(prev => prev.filter(song => !selectedTracks.includes(song.id)));
    setSelectedTracks([]);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalDuration = likedSongs.reduce((sum, song) => sum + song.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 via-black to-black text-white">
      {/* Hero Section */}
      <div className="relative px-6 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-6 md:space-y-0 md:space-x-6">
            {/* Liked Songs Cover */}
            <div className="w-64 h-64 rounded-lg shadow-2xl overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 flex items-center justify-center">
              <Heart className="w-24 h-24 text-white fill-current" />
            </div>

            {/* Playlist Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-white/70">PLAYLIST</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 leading-none">
                Liked Songs
              </h1>

              <p className="text-white/70 text-lg mb-4 max-w-2xl">
                Songs you've liked will appear here
              </p>

              <div className="flex items-center space-x-2 text-sm text-white/70">
                <img
                  src={session.user.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop&crop=face'}
                  alt={session.user.name || 'User'}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium text-white">
                  {session.user.name}
                </span>
                <span>•</span>
                <span>{likedSongs.length} songs</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </>
                )}
              </div>
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
                disabled={likedSongs.length === 0}
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

              {/* Download Button (Premium Feature) */}
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white"
              >
                <Download className="w-6 h-6" />
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedTracks.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-zinc-800 rounded-full">
                <span className="text-sm">{selectedTracks.length} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkUnlike}
                  className="text-xs h-6 px-2 text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
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
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Find in liked songs"
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : sortedSongs.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery ? 'No liked songs found' : 'Songs you like will appear here'}
              </h3>
              <p className="text-zinc-400 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Save songs by tapping the heart icon'
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/search')}
                  className="bg-green-500 hover:bg-green-600 text-black font-medium"
                >
                  Find music
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
                    onClick={() => handleSort('likedAt')}
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>Date Added</span>
                    {sortBy === 'likedAt' && (
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

              {/* Track Items */}
              <div className="space-y-1">
                {sortedSongs.map((song, index) => {
                  const isCurrentTrack = currentTrack?.id === song.id;
                  const isSelected = selectedTracks.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      className={`
                        group grid grid-cols-12 gap-4 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer
                        hover:bg-white/5 ${isSelected ? 'bg-white/10' : ''}
                        ${isCurrentTrack ? 'bg-green-500/10' : ''}
                      `}
                      onClick={() => handlePlayTrack(song, index)}
                    >
                      {/* Index/Play Button */}
                      <div className="col-span-1 flex items-center">
                        {selectedTracks.length > 0 ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTrackSelection(song.id)}
                            className="w-4 h-4 text-green-500 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center">
                            {isCurrentTrack && isPlaying ? (
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-1 h-3 bg-green-500 animate-pulse mr-0.5"></div>
                                <div className="w-1 h-2 bg-green-500 animate-pulse delay-75 mr-0.5"></div>
                                <div className="w-1 h-4 bg-green-500 animate-pulse delay-150"></div>
                              </div>
                            ) : (
                              <span className={`text-sm ${isCurrentTrack ? 'text-green-400' : 'text-zinc-400 group-hover:hidden'}`}>
                                {index + 1}
                              </span>
                            )}
                            {!isCurrentTrack && (
                              <Play className="w-4 h-4 text-white hidden group-hover:block" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="col-span-5 flex items-center space-x-3 min-w-0">
                        <img
                          src={song.album.imageUrl || song.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop'}
                          alt={song.album.title}
                          className="w-10 h-10 rounded flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                            {song.title}
                          </h4>
                          <p className="text-sm text-zinc-400 truncate">
                            {song.artist.name}
                          </p>
                        </div>
                      </div>

                      {/* Album */}
                      <div className="col-span-2 hidden md:flex items-center">
                        <span className="text-sm text-zinc-400 truncate hover:text-white cursor-pointer">
                          {song.album.title}
                        </span>
                      </div>

                      {/* Date Liked */}
                      <div className="col-span-2 hidden lg:flex items-center">
                        <span className="text-sm text-zinc-400">
                          {formatDate(song.likedAt)}
                        </span>
                      </div>

                      {/* Duration & Actions */}
                      <div className="col-span-2 flex items-center justify-between">
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlike(song.id);
                            }}
                            className="w-8 h-8 p-0 text-green-400 hover:text-white"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                        <span className="text-sm text-zinc-400 group-hover:opacity-0">
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Spacing */}
      <div className="h-32" />
    </div>
  );
}