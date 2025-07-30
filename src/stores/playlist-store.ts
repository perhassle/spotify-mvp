import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Playlist, 
  PlaylistFolder, 
  PlaylistCreateRequest, 
  PlaylistUpdateRequest, 
  Track, 
  PlaylistTrack,
  PlaylistTemplate,
  PlaylistShareSettings 
} from '@/types';

interface PlaylistState {
  // State
  playlists: Playlist[];
  folders: PlaylistFolder[];
  templates: PlaylistTemplate[];
  currentPlaylist: Playlist | null;
  selectedPlaylists: string[];
  isLoading: boolean;
  error: string | null;
  
  // UI State
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'created' | 'updated' | 'duration' | 'tracks';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  selectedFolder: string | null;
  
  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  createPlaylist: (request: PlaylistCreateRequest) => Promise<Playlist>;
  updatePlaylist: (id: string, request: PlaylistUpdateRequest) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  duplicatePlaylist: (id: string, name?: string) => Promise<Playlist>;
  
  // Track Management
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderTracks: (playlistId: string, startIndex: number, endIndex: number) => Promise<void>;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
  removeTracksFromPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
  
  // Folder Management
  createFolder: (name: string, color?: string) => Promise<PlaylistFolder>;
  updateFolder: (id: string, name: string, color?: string) => Promise<PlaylistFolder>;
  deleteFolder: (id: string) => Promise<void>;
  movePlaylistToFolder: (playlistId: string, folderId: string | null) => Promise<void>;
  
  // Sharing
  generateShareUrl: (playlistId: string, settings: Partial<PlaylistShareSettings>) => Promise<string>;
  updateShareSettings: (playlistId: string, settings: Partial<PlaylistShareSettings>) => Promise<void>;
  
  // UI Actions
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'name' | 'created' | 'updated' | 'duration' | 'tracks') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolder: (folderId: string | null) => void;
  togglePlaylistSelection: (playlistId: string) => void;
  clearSelection: () => void;
  
  // Utility
  getFilteredPlaylists: () => Playlist[];
  getUserPlaylists: (userId: string) => Playlist[];
  getPlaylistById: (id: string) => Playlist | undefined;
  getPlaylistDuration: (id: string) => number;
  isPlaylistLiked: (id: string) => boolean;
  
  // Loading and Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const usePlaylistStore = create<PlaylistState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        playlists: [],
        folders: [],
        templates: [],
        currentPlaylist: null,
        selectedPlaylists: [],
        isLoading: false,
        error: null,
        
        // UI State
        viewMode: 'grid',
        sortBy: 'created',
        sortOrder: 'desc',
        searchQuery: '',
        selectedFolder: null,
        
        // Actions
        setPlaylists: (playlists) => set({ playlists }),
        
        setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
        
        createPlaylist: async (request) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch('/api/playlist/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create playlist');
            }
            
            const newPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: [...state.playlists, newPlaylist],
              isLoading: false
            }));
            
            return newPlaylist;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updatePlaylist: async (id, request) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request),
            });
            
            if (!response.ok) {
              throw new Error('Failed to update playlist');
            }
            
            const updatedPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === id ? updatedPlaylist : p
              ),
              currentPlaylist: state.currentPlaylist?.id === id ? updatedPlaylist : state.currentPlaylist,
              isLoading: false
            }));
            
            return updatedPlaylist;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        deletePlaylist: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) {
              throw new Error('Failed to delete playlist');
            }
            
            set(state => ({
              playlists: state.playlists.filter(p => p.id !== id),
              currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
              selectedPlaylists: state.selectedPlaylists.filter(pid => pid !== id),
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        duplicatePlaylist: async (id, name) => {
          const originalPlaylist = get().getPlaylistById(id);
          if (!originalPlaylist) {
            throw new Error('Playlist not found');
          }
          
          return get().createPlaylist({
            name: name || `${originalPlaylist.name} (Copy)`,
            description: originalPlaylist.description,
            isPublic: false,
            collaborative: false,
            tags: originalPlaylist.tags,
            folderId: originalPlaylist.folderId,
          });
        },
        
        // Track Management
        addTrackToPlaylist: async (playlistId, trackId) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trackIds: [trackId] }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to add track to playlist');
            }
            
            const updatedPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === playlistId ? updatedPlaylist : p
              ),
              currentPlaylist: state.currentPlaylist?.id === playlistId ? updatedPlaylist : state.currentPlaylist,
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        removeTrackFromPlaylist: async (playlistId, trackId) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/tracks/${trackId}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) {
              throw new Error('Failed to remove track from playlist');
            }
            
            const updatedPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === playlistId ? updatedPlaylist : p
              ),
              currentPlaylist: state.currentPlaylist?.id === playlistId ? updatedPlaylist : state.currentPlaylist,
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        reorderTracks: async (playlistId, startIndex, endIndex) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/reorder`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ startIndex, endIndex }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to reorder tracks');
            }
            
            const updatedPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === playlistId ? updatedPlaylist : p
              ),
              currentPlaylist: state.currentPlaylist?.id === playlistId ? updatedPlaylist : state.currentPlaylist,
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        addTracksToPlaylist: async (playlistId, trackIds) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trackIds }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to add tracks to playlist');
            }
            
            const updatedPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === playlistId ? updatedPlaylist : p
              ),
              currentPlaylist: state.currentPlaylist?.id === playlistId ? updatedPlaylist : state.currentPlaylist,
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        removeTracksFromPlaylist: async (playlistId, trackIds) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trackIds }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to remove tracks from playlist');
            }
            
            const updatedPlaylist: Playlist = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === playlistId ? updatedPlaylist : p
              ),
              currentPlaylist: state.currentPlaylist?.id === playlistId ? updatedPlaylist : state.currentPlaylist,
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        // Folder Management
        createFolder: async (name, color) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch('/api/playlist/folder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, color }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create folder');
            }
            
            const newFolder: PlaylistFolder = await response.json();
            
            set(state => ({
              folders: [...state.folders, newFolder],
              isLoading: false
            }));
            
            return newFolder;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateFolder: async (id, name, color) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/folder/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, color }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to update folder');
            }
            
            const updatedFolder: PlaylistFolder = await response.json();
            
            set(state => ({
              folders: state.folders.map(f => 
                f.id === id ? updatedFolder : f
              ),
              isLoading: false
            }));
            
            return updatedFolder;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        deleteFolder: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/folder/${id}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) {
              throw new Error('Failed to delete folder');
            }
            
            set(state => ({
              folders: state.folders.filter(f => f.id !== id),
              playlists: state.playlists.map(p => 
                p.folderId === id ? { ...p, folderId: null } : p
              ) as Playlist[],
              selectedFolder: state.selectedFolder === id ? null : state.selectedFolder,
              isLoading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        movePlaylistToFolder: async (playlistId, folderId) => {
          await get().updatePlaylist(playlistId, { folderId });
        },
        
        // Sharing
        generateShareUrl: async (playlistId, settings) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings),
            });
            
            if (!response.ok) {
              throw new Error('Failed to generate share URL');
            }
            
            const { shareUrl }: { shareUrl: string } = await response.json();
            
            set(state => ({
              playlists: state.playlists.map(p => 
                p.id === playlistId ? { ...p, shareUrl } : p
              ),
              isLoading: false
            }));
            
            return shareUrl;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        updateShareSettings: async (playlistId, settings) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/playlist/${playlistId}/share`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings),
            });
            
            if (!response.ok) {
              throw new Error('Failed to update share settings');
            }
            
            set({ isLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            throw error;
          }
        },
        
        // UI Actions
        setViewMode: (mode) => set({ viewMode: mode }),
        setSortBy: (sortBy) => set({ sortBy }),
        setSortOrder: (order) => set({ sortOrder: order }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSelectedFolder: (folderId) => set({ selectedFolder: folderId }),
        
        togglePlaylistSelection: (playlistId) => 
          set(state => ({
            selectedPlaylists: state.selectedPlaylists.includes(playlistId)
              ? state.selectedPlaylists.filter(id => id !== playlistId)
              : [...state.selectedPlaylists, playlistId]
          })),
        
        clearSelection: () => set({ selectedPlaylists: [] }),
        
        // Utility
        getFilteredPlaylists: () => {
          const { playlists, searchQuery, selectedFolder, sortBy, sortOrder } = get();
          
          const filtered = playlists.filter(playlist => {
            const matchesSearch = !searchQuery || 
              playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              playlist.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              playlist.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesFolder = selectedFolder === null || playlist.folderId === selectedFolder;
            
            return matchesSearch && matchesFolder;
          });
          
          // Sort playlists
          filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'created':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
              case 'updated':
                comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                break;
              case 'duration':
                comparison = a.totalDuration - b.totalDuration;
                break;
              case 'tracks':
                comparison = a.trackCount - b.trackCount;
                break;
              default:
                comparison = 0;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
          });
          
          return filtered;
        },
        
        getUserPlaylists: (userId) => 
          get().playlists.filter(playlist => playlist.owner.id === userId),
        
        getPlaylistById: (id) => 
          get().playlists.find(playlist => playlist.id === id),
        
        getPlaylistDuration: (id) => {
          const playlist = get().getPlaylistById(id);
          return playlist?.totalDuration || 0;
        },
        
        isPlaylistLiked: (id) => {
          // This would typically check a liked playlists state
          // For now, return false as placeholder
          return false;
        },
        
        // Loading and Error
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'playlist-store',
        partialize: (state) => ({
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          selectedFolder: state.selectedFolder,
        }),
      }
    ),
    { name: 'playlist-store' }
  )
);

export default usePlaylistStore;