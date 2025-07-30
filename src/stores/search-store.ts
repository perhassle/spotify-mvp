import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { 
  SearchState, 
  SearchResults, 
  SearchFilters, 
  SearchHistoryItem,
  SearchSuggestion 
} from "@/types";

interface SearchActions {
  // Query Management
  setQuery: (query: string) => void;
  clearQuery: () => void;
  
  // Filter Management
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setSelectedResultType: (type: "all" | "track" | "artist" | "album" | "playlist") => void;
  
  // Results Management
  setResults: (results: SearchResults) => void;
  clearResults: () => void;
  
  // Loading and Error States
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Search History
  addToHistory: (query: string, resultCount: number, filters?: SearchFilters) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  
  // Suggestions
  setSuggestions: (suggestions: string[]) => void;
  clearSuggestions: () => void;
  
  // Search Actions
  performSearch: (query: string, filters?: Partial<SearchFilters>) => Promise<void>;
  
  // Reset
  reset: () => void;
}

type SearchStore = SearchState & SearchActions;

const initialFilters: SearchFilters = {
  type: "all",
  sortBy: "relevance",
  sortOrder: "desc",
};

const initialState: SearchState = {
  query: "",
  filters: initialFilters,
  results: null,
  isLoading: false,
  error: null,
  suggestions: [],
  history: [],
  selectedResultType: "all",
};

// Search function - this will be replaced with actual API call later
const searchMusic = async (query: string, filters: SearchFilters): Promise<SearchResults> => {
  // Import mock data
  const mockData = await import("@/data/mock-music-database.json");
  
  if (!query.trim()) {
    return {
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      totalResults: 0,
    };
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  // Search tracks
  let tracks = mockData.tracks.filter(track => {
    const trackData = mockData.tracks.find(t => t.id === track.id);
    const artistData = mockData.artists.find(a => a.id === track.artist);
    const albumData = mockData.albums.find(a => a.id === track.album);
    
    return trackData && artistData && albumData && (
      trackData.title.toLowerCase().includes(searchTerm) ||
      artistData.name.toLowerCase().includes(searchTerm) ||
      albumData.title.toLowerCase().includes(searchTerm) ||
      trackData.genres.some(genre => genre.toLowerCase().includes(searchTerm))
    );
  });
  
  // Search artists
  let artists = mockData.artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm) ||
    artist.bio?.toLowerCase().includes(searchTerm) ||
    artist.genres.some(genre => genre.toLowerCase().includes(searchTerm))
  );
  
  // Search albums
  let albums = mockData.albums.filter(album => {
    const artistData = mockData.artists.find(a => a.id === album.artist);
    return artistData && (
      album.title.toLowerCase().includes(searchTerm) ||
      artistData.name.toLowerCase().includes(searchTerm) ||
      album.genres.some(genre => genre.toLowerCase().includes(searchTerm))
    );
  });
  
  // Apply filters
  if (filters.type && filters.type !== "all") {
    switch (filters.type) {
      case "track":
        artists = [];
        albums = [];
        break;
      case "artist":
        tracks = [];
        albums = [];
        break;
      case "album":
        tracks = [];
        artists = [];
        break;
      default:
        break;
    }
  }
  
  if (filters.genre) {
    tracks = tracks.filter(track => track.genres.includes(filters.genre!));
    artists = artists.filter(artist => artist.genres.includes(filters.genre!));
    albums = albums.filter(album => album.genres.includes(filters.genre!));
  }
  
  if (filters.explicit !== undefined) {
    tracks = tracks.filter(track => track.isExplicit === filters.explicit);
  }
  
  // Apply sorting
  const sortTracks = (tracks: typeof mockData.tracks) => {
    return tracks.sort((a, b) => {
      switch (filters.sortBy) {
        case "popularity":
          return filters.sortOrder === "asc" ? a.popularity - b.popularity : b.popularity - a.popularity;
        case "release_date":
          const dateA = new Date(a.releaseDate).getTime();
          const dateB = new Date(b.releaseDate).getTime();
          return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        case "alphabetical":
          return filters.sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
        case "relevance":
        default:
          // For relevance, prioritize exact matches and higher popularity
          const scoreA = (a.title.toLowerCase() === searchTerm ? 100 : 0) + a.popularity;
          const scoreB = (b.title.toLowerCase() === searchTerm ? 100 : 0) + b.popularity;
          return scoreB - scoreA;
      }
    });
  };
  
  const sortArtists = (artists: typeof mockData.artists) => {
    return artists.sort((a, b) => {
      switch (filters.sortBy) {
        case "popularity":
          return filters.sortOrder === "asc" ? a.popularity - b.popularity : b.popularity - a.popularity;
        case "alphabetical":
          return filters.sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case "relevance":
        default:
          const scoreA = (a.name.toLowerCase() === searchTerm ? 100 : 0) + a.popularity;
          const scoreB = (b.name.toLowerCase() === searchTerm ? 100 : 0) + b.popularity;
          return scoreB - scoreA;
      }
    });
  };
  
  const sortAlbums = (albums: typeof mockData.albums) => {
    return albums.sort((a, b) => {
      switch (filters.sortBy) {
        case "release_date":
          const dateA = new Date(a.releaseDate).getTime();
          const dateB = new Date(b.releaseDate).getTime();
          return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        case "alphabetical":
          return filters.sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
        case "relevance":
        default:
          const scoreA = a.title.toLowerCase() === searchTerm ? 100 : 0;
          const scoreB = b.title.toLowerCase() === searchTerm ? 100 : 0;
          return scoreB - scoreA;
      }
    });
  };
  
  // Transform data to match expected interface
  const transformedTracks = sortTracks(tracks).map(track => {
    const artist = mockData.artists.find(a => a.id === track.artist)!;
    const album = mockData.albums.find(a => a.id === track.album)!;
    
    return {
      ...track,
      artist,
      album: {
        ...album,
        artist,
        releaseDate: new Date(album.releaseDate),
        type: album.type as "album" | "single" | "compilation",
      },
      releaseDate: new Date(track.releaseDate),
    };
  });
  
  const transformedAlbums = sortAlbums(albums).map(album => {
    const artist = mockData.artists.find(a => a.id === album.artist)!;
    
    return {
      ...album,
      artist,
      releaseDate: new Date(album.releaseDate),
      type: album.type as "album" | "single" | "compilation",
    };
  });
  
  const sortedArtists = sortArtists(artists);
  
  return {
    tracks: transformedTracks,
    artists: sortedArtists,
    albums: transformedAlbums,
    playlists: [], // No playlists in mock data yet
    totalResults: transformedTracks.length + sortedArtists.length + transformedAlbums.length,
  };
};

export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setQuery: (query) => {
          set({ query });
        },
        
        clearQuery: () => {
          set({ query: "", results: null, error: null });
        },
        
        setFilters: (newFilters) => {
          const currentFilters = get().filters;
          const updatedFilters = { ...currentFilters, ...newFilters };
          set({ filters: updatedFilters });
        },
        
        resetFilters: () => {
          set({ filters: initialFilters });
        },
        
        setSelectedResultType: (type) => {
          set({ selectedResultType: type });
        },
        
        setResults: (results) => {
          set({ results, error: null });
        },
        
        clearResults: () => {
          set({ results: null, error: null });
        },
        
        setLoading: (loading) => {
          set({ isLoading: loading });
        },
        
        setError: (error) => {
          set({ error, isLoading: false });
        },
        
        addToHistory: (query, resultCount, filters) => {
          const { history } = get();
          const historyItem: SearchHistoryItem = {
            id: `${Date.now()}-${Math.random()}`,
            query,
            timestamp: new Date(),
            resultCount,
            ...(filters && { filters }),
          };
          
          // Remove duplicate queries and limit to 20 items
          const filteredHistory = history.filter(item => item.query !== query);
          const newHistory = [historyItem, ...filteredHistory].slice(0, 20);
          
          set({ history: newHistory });
        },
        
        removeFromHistory: (id) => {
          const { history } = get();
          const newHistory = history.filter(item => item.id !== id);
          set({ history: newHistory });
        },
        
        clearHistory: () => {
          set({ history: [] });
        },
        
        setSuggestions: (suggestions) => {
          set({ suggestions });
        },
        
        clearSuggestions: () => {
          set({ suggestions: [] });
        },
        
        performSearch: async (query, filters = {}) => {
          const state = get();
          const searchFilters = { ...state.filters, ...filters };
          
          set({ 
            query, 
            filters: searchFilters, 
            isLoading: true, 
            error: null 
          });
          
          try {
            const results = await searchMusic(query, searchFilters);
            set({ 
              results, 
              isLoading: false,
              error: null 
            });
            
            // Add to history if query is not empty and has results
            if (query.trim() && results.totalResults > 0) {
              get().addToHistory(query, results.totalResults, searchFilters);
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : "Search failed", 
              isLoading: false,
              results: null 
            });
          }
        },
        
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: "search-store",
        // Only persist history, not the current search state
        partialize: (state) => ({ 
          history: state.history 
        }),
      }
    ),
    {
      name: "search-store",
    }
  )
);