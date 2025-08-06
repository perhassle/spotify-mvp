import { NextRequest, NextResponse } from "next/server";
import mockDatabase from "@/data/mock-music-database.json";
import type { SearchResults, SearchFilters } from "@/types";
import { sanitizeSearchQuery } from '@/lib/security/sanitization';
import { 
  createSuccessResponse, 
  serverError, 
  getRequestPath 
} from '@/lib/api/error-responses';
import { 
  validateQueryParams, 
  searchParamsSchema 
} from '@/lib/api/validate-request';
import { withStandardMiddleware } from '@/lib/api/middleware';

async function searchHandler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const path = getRequestPath(request);
  
  // Validate and sanitize search parameters
  const validation = validateQueryParams(searchParamsSchema, searchParams, request);
  if ('error' in validation) {
    return validation.error;
  }

  const { q: query, limit, offset, ...filters } = validation.data;
  
  // Perform search
  const results = await performSearch(query, filters, limit, offset);
  
  return createSuccessResponse(results, {
    page: Math.floor(offset / limit) + 1,
    limit,
    total: results.totalResults,
  });
}

export const GET = withStandardMiddleware(searchHandler);

async function performSearch(
  query: string, 
  filters: Omit<SearchFilters, "sortBy" | "sortOrder"> & { sortBy: "relevance" | "popularity" | "release_date" | "alphabetical", sortOrder: "asc" | "desc" },
  limit: number,
  offset: number
): Promise<SearchResults> {
  const searchTerm = query.toLowerCase().trim();
  
  // Search tracks
  let tracks = mockDatabase.tracks.filter(track => {
    const artistData = mockDatabase.artists.find(a => a.id === track.artist);
    const albumData = mockDatabase.albums.find(a => a.id === track.album);
    
    if (!artistData || !albumData) return false;
    
    const matchesQuery = 
      track.title.toLowerCase().includes(searchTerm) ||
      artistData.name.toLowerCase().includes(searchTerm) ||
      albumData.title.toLowerCase().includes(searchTerm) ||
      track.genres.some(genre => genre.toLowerCase().includes(searchTerm));
    
    if (!matchesQuery) return false;
    
    // Apply filters
    if (filters.genre && !track.genres.includes(filters.genre)) return false;
    if (filters.year) {
      const trackYear = new Date(track.releaseDate).getFullYear();
      if (trackYear !== filters.year) return false;
    }
    if (filters.explicit !== undefined && track.isExplicit !== filters.explicit) return false;
    
    return true;
  });
  
  // Search artists
  let artists = mockDatabase.artists.filter(artist => {
    const matchesQuery = 
      artist.name.toLowerCase().includes(searchTerm) ||
      (artist.bio && artist.bio.toLowerCase().includes(searchTerm)) ||
      artist.genres.some(genre => genre.toLowerCase().includes(searchTerm));
    
    if (!matchesQuery) return false;
    
    // Apply filters
    if (filters.genre && !artist.genres.includes(filters.genre)) return false;
    
    return true;
  });
  
  // Search albums
  let albums = mockDatabase.albums.filter(album => {
    const artistData = mockDatabase.artists.find(a => a.id === album.artist);
    if (!artistData) return false;
    
    const matchesQuery = 
      album.title.toLowerCase().includes(searchTerm) ||
      artistData.name.toLowerCase().includes(searchTerm) ||
      album.genres.some(genre => genre.toLowerCase().includes(searchTerm));
    
    if (!matchesQuery) return false;
    
    // Apply filters
    if (filters.genre && !album.genres.includes(filters.genre)) return false;
    if (filters.year) {
      const albumYear = new Date(album.releaseDate).getFullYear();
      if (albumYear !== filters.year) return false;
    }
    
    return true;
  });
  
  // Apply type filter
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
  
  // Sort results
  const sortTracks = (tracks: typeof mockDatabase.tracks) => {
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
          const getRelevanceScore = (track: typeof a) => {
            const artistData = mockDatabase.artists.find(artist => artist.id === track.artist);
            const albumData = mockDatabase.albums.find(album => album.id === track.album);
            
            let score = track.popularity;
            
            // Boost exact title matches
            if (track.title.toLowerCase() === searchTerm) score += 100;
            else if (track.title.toLowerCase().startsWith(searchTerm)) score += 50;
            
            // Boost exact artist matches
            if (artistData?.name.toLowerCase() === searchTerm) score += 80;
            else if (artistData?.name.toLowerCase().startsWith(searchTerm)) score += 40;
            
            // Boost exact album matches
            if (albumData?.title.toLowerCase() === searchTerm) score += 60;
            else if (albumData?.title.toLowerCase().startsWith(searchTerm)) score += 30;
            
            return score;
          };
          
          const scoreA = getRelevanceScore(a);
          const scoreB = getRelevanceScore(b);
          return scoreB - scoreA;
      }
    });
  };
  
  const sortArtists = (artists: typeof mockDatabase.artists) => {
    return artists.sort((a, b) => {
      switch (filters.sortBy) {
        case "popularity":
          return filters.sortOrder === "asc" ? a.popularity - b.popularity : b.popularity - a.popularity;
        case "alphabetical":
          return filters.sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case "relevance":
        default:
          const getRelevanceScore = (artist: typeof a) => {
            let score = artist.popularity;
            
            // Boost exact matches
            if (artist.name.toLowerCase() === searchTerm) score += 100;
            else if (artist.name.toLowerCase().startsWith(searchTerm)) score += 50;
            
            return score;
          };
          
          const scoreA = getRelevanceScore(a);
          const scoreB = getRelevanceScore(b);
          return scoreB - scoreA;
      }
    });
  };
  
  const sortAlbums = (albums: typeof mockDatabase.albums) => {
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
          const getRelevanceScore = (album: typeof a) => {
            const artistData = mockDatabase.artists.find(artist => artist.id === album.artist);
            let score = 0;
            
            // Boost exact title matches
            if (album.title.toLowerCase() === searchTerm) score += 100;
            else if (album.title.toLowerCase().startsWith(searchTerm)) score += 50;
            
            // Boost exact artist matches
            if (artistData?.name.toLowerCase() === searchTerm) score += 80;
            else if (artistData?.name.toLowerCase().startsWith(searchTerm)) score += 40;
            
            return score;
          };
          
          const scoreA = getRelevanceScore(a);
          const scoreB = getRelevanceScore(b);
          return scoreB - scoreA;
      }
    });
  };
  
  // Transform data to match expected interface
  const transformedTracks = sortTracks(tracks).map(track => {
    const artist = mockDatabase.artists.find(a => a.id === track.artist)!;
    const album = mockDatabase.albums.find(a => a.id === track.album)!;
    
    return {
      id: track.id,
      title: track.title,
      artist,
      album: {
        id: album.id,
        title: album.title,
        artist,
        releaseDate: new Date(album.releaseDate),
        totalTracks: album.totalTracks,
        imageUrl: album.imageUrl,
        genres: album.genres,
        type: (album.type as "album" | "single" | "compilation") || "album",
      },
      duration: track.duration,
      previewUrl: track.previewUrl,
      streamUrl: track.streamUrl,
      isExplicit: track.isExplicit,
      popularity: track.popularity,
      trackNumber: track.trackNumber,
      genres: track.genres,
      releaseDate: new Date(track.releaseDate),
      imageUrl: track.imageUrl,
    };
  });
  
  const transformedAlbums = sortAlbums(albums).map(album => {
    const artist = mockDatabase.artists.find(a => a.id === album.artist)!;
    
    return {
      id: album.id,
      title: album.title,
      artist,
      releaseDate: new Date(album.releaseDate),
      totalTracks: album.totalTracks,
      imageUrl: album.imageUrl,
      genres: album.genres,
      type: (album.type as "album" | "single" | "compilation") || "album",
    };
  });
  
  const sortedArtists = sortArtists(artists);
  
  // Apply pagination
  const totalResults = transformedTracks.length + sortedArtists.length + transformedAlbums.length;
  
  // For simplicity, we'll apply pagination across all result types combined
  // In a real implementation, you might want more sophisticated pagination
  const allResults = [
    ...transformedTracks.map(t => ({ ...t, resultType: "track" as const })),
    ...sortedArtists.map(a => ({ ...a, resultType: "artist" as const })),
    ...transformedAlbums.map(a => ({ ...a, resultType: "album" as const })),
  ];
  
  const paginatedResults = allResults.slice(offset, offset + limit);
  
  // Separate back into types
  const paginatedTracks = paginatedResults.filter(r => r.resultType === "track").map(r => {
    const { resultType, ...track } = r;
    return track;
  });
  
  const paginatedArtists = paginatedResults.filter(r => r.resultType === "artist").map(r => {
    const { resultType, ...artist } = r;
    return artist;
  });
  
  const paginatedAlbums = paginatedResults.filter(r => r.resultType === "album").map(r => {
    const { resultType, ...album } = r;
    return album;
  });
  
  const searchResults: SearchResults = {
    tracks: paginatedTracks,
    artists: paginatedArtists,
    albums: paginatedAlbums,
    playlists: [], // No playlists in mock data yet
    totalResults,
  };

  return searchResults;
}