'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Filter, 
  SortAsc,
  SortDesc,
  Music,
  Clock,
  Calendar,
  Hash,
  ChevronDown,
  Heart,
  Download,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import usePlaylistStore from '@/stores/playlist-store';
import CreatePlaylistModal from '@/components/features/playlist/create-playlist-modal';
import PlaylistCard from '@/components/features/playlist/playlist-card';
import PlaylistListItem from '@/components/features/playlist/playlist-list-item';

export default function PlaylistsPageClient() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const {
    playlists,
    folders,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    selectedFolder,
    selectedPlaylists,
    isLoading,
    setViewMode,
    setSortBy,
    setSortOrder,
    setSearchQuery,
    setSelectedFolder,
    getFilteredPlaylists,
    clearSelection,
  } = usePlaylistStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  const filteredPlaylists = getFilteredPlaylists();
  const hasSelection = selectedPlaylists.length > 0;

  // Mock data for demonstration
  useEffect(() => {
    if (session && playlists.length === 0) {
      // In a real app, fetch user's playlists here
      // fetchUserPlaylists(session.user.id);
    }
  }, [session, playlists.length]);

  const sortOptions = [
    { key: 'name', label: 'Name', icon: SortAsc },
    { key: 'created', label: 'Recently Created', icon: Calendar },
    { key: 'updated', label: 'Recently Updated', icon: Clock },
    { key: 'tracks', label: 'Track Count', icon: Hash },
    { key: 'duration', label: 'Duration', icon: Music },
  ] as const;

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  };

  const handlePlaylistSuccess = (playlistId: string) => {
    router.push(`/playlist/${playlistId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-zinc-800 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Your Library</h1>
              <span className="text-sm text-zinc-400">
                {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {hasSelection && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-zinc-800 rounded-full">
                  <span className="text-sm">{selectedPlaylists.length} selected</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs h-6 px-2"
                  >
                    Clear
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(true)}
                className="border-zinc-600 text-white hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Folder Filter */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFolderMenu(!showFolderMenu)}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {selectedFolder ? 
                    folders.find(f => f.id === selectedFolder)?.name : 
                    'All Folders'
                  }
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>

                {showFolderMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20">
                    <button
                      onClick={() => {
                        setSelectedFolder(null);
                        setShowFolderMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-zinc-700 first:rounded-t-lg ${
                        !selectedFolder ? 'bg-zinc-700' : ''
                      }`}
                    >
                      All Folders
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => {
                          setSelectedFolder(folder.id);
                          setShowFolderMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-zinc-700 ${
                          selectedFolder === folder.id ? 'bg-zinc-700' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span>{folder.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 mr-2" />
                  ) : (
                    <SortDesc className="w-4 h-4 mr-2" />
                  )}
                  {sortOptions.find(opt => opt.key === sortBy)?.label}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>

                {showSortMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20">
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = sortBy === option.key;
                      
                      return (
                        <button
                          key={option.key}
                          onClick={() => handleSort(option.key)}
                          className={`w-full px-4 py-2 text-left hover:bg-zinc-700 flex items-center space-x-2 first:rounded-t-lg last:rounded-b-lg ${
                            isActive ? 'bg-zinc-700' : ''
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                          {isActive && (
                            <div className="ml-auto">
                              {sortOrder === 'asc' ? (
                                <SortAsc className="w-3 h-3" />
                              ) : (
                                <SortDesc className="w-3 h-3" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-zinc-600 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-none ${
                    viewMode === 'grid' 
                      ? 'bg-zinc-700 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No playlists found
                </h3>
                <p className="text-zinc-400 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFolder(null);
                  }}
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div>
                <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Create your first playlist
                </h3>
                <p className="text-zinc-400 mb-6">
                  It&apos;s easy, we&apos;ll help you
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-black font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Quick Access Playlists */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Liked Songs */}
                <button
                  onClick={() => router.push('/liked-songs')}
                  className="flex items-center space-x-4 p-4 bg-gradient-to-br from-purple-700 to-blue-800 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white fill-current" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Liked Songs</h3>
                    <p className="text-sm text-purple-200">Your favorite tracks</p>
                  </div>
                </button>

                {/* Downloaded Music (Premium Feature) */}
                <button
                  onClick={() => router.push('/downloaded')}
                  className="flex items-center space-x-4 p-4 bg-gradient-to-br from-green-700 to-emerald-800 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Downloaded</h3>
                    <p className="text-sm text-green-200">Available offline</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Playlists */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {selectedFolder 
                    ? folders.find(f => f.id === selectedFolder)?.name 
                    : 'All Playlists'
                  }
                </h2>
                
                {hasSelection && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {viewMode === 'grid' ? (
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredPlaylists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* List Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                    <div className="col-span-6">Title</div>
                    <div className="col-span-2 hidden sm:block">Tracks</div>
                    <div className="col-span-2 hidden md:block">Duration</div>
                    <div className="col-span-2 hidden lg:block">Modified</div>
                  </div>
                  
                  {/* List Items */}
                  {filteredPlaylists.map((playlist, index) => (
                    <PlaylistListItem 
                      key={playlist.id} 
                      playlist={playlist} 
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePlaylistSuccess}
      />
    </div>
  );
}