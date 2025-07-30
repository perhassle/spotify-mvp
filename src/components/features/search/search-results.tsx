"use client";

import { useState } from "react";
import { Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";
import { useSearchStore } from "@/stores/search-store";
import { usePlayerStore } from "@/stores/player-store";
import { TrackCard } from "./track-card";
import { ArtistCard } from "./artist-card";
import { AlbumCard } from "./album-card";
import { SearchEmptyState, SearchErrorState, SearchLoadingState } from "./search-states";
import { SearchFiltersComponent } from "./search-filters";
import type { Track, Artist, Album } from "@/types";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  className?: string;
}

export function SearchResults({ className }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const {
    query,
    results,
    isLoading,
    error,
    selectedResultType,
    filters,
    resetFilters,
  } = useSearchStore();

  const { setQueue, play, addToQueue } = usePlayerStore();

  // Handle play track
  const handlePlayTrack = (track: Track) => {
    if (results?.tracks) {
      setQueue(results.tracks, results.tracks.findIndex(t => t.id === track.id));
      play(track);
    }
  };

  // Handle play artist (play their popular tracks)
  const handlePlayArtist = (artist: Artist) => {
    if (results?.tracks) {
      const artistTracks = results.tracks.filter(track => track.artist.id === artist.id);
      if (artistTracks.length > 0) {
        setQueue(artistTracks);
        play(artistTracks[0]);
      }
    }
  };

  // Handle play album
  const handlePlayAlbum = (album: Album) => {
    if (results?.tracks) {
      const albumTracks = results.tracks.filter(track => track.album.id === album.id);
      if (albumTracks.length > 0) {
        setQueue(albumTracks);
        play(albumTracks[0]);
      }
    }
  };

  // Handle add to queue
  const handleAddToQueue = (track: Track) => {
    addToQueue(track);
  };

  // Handle like (placeholder for now)
  const handleLike = (item: Track | Artist | Album) => {
    console.log("Like:", item);
    // TODO: Implement like functionality
  };

  // Handle follow (placeholder for now)
  const handleFollow = (artist: Artist) => {
    console.log("Follow:", artist);
    // TODO: Implement follow functionality
  };

  // Check if filters are active
  const hasActiveFilters = filters.genre || filters.year || filters.explicit !== undefined || filters.sortBy !== "relevance";

  // Show loading state
  if (isLoading) {
    return <SearchLoadingState className={className} />;
  }

  // Show error state
  if (error) {
    return (
      <SearchErrorState
        error={error}
        onRetry={() => useSearchStore.getState().performSearch(query)}
        className={className}
      />
    );
  }

  // Show empty state if no query
  if (!query) {
    return <SearchEmptyState className={className} />;
  }

  // Show no results state
  if (!results || results.totalResults === 0) {
    return (
      <SearchEmptyState
        query={query}
        hasFilters={Boolean(hasActiveFilters)}
        onClearFilters={resetFilters}
        className={className}
      />
    );
  }

  // Get results based on selected type
  const getDisplayResults = () => {
    if (!results) return { tracks: [], artists: [], albums: [], total: 0 };

    switch (selectedResultType) {
      case "track":
        return { tracks: results.tracks, artists: [], albums: [], total: results.tracks.length };
      case "artist":
        return { tracks: [], artists: results.artists, albums: [], total: results.artists.length };
      case "album":
        return { tracks: [], artists: [], albums: results.albums, total: results.albums.length };
      default:
        return {
          tracks: results.tracks,
          artists: results.artists,
          albums: results.albums,
          total: results.totalResults,
        };
    }
  };

  const displayResults = getDisplayResults();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <SearchFiltersComponent compact />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {selectedResultType === "all" 
              ? `Search results for "${query}"` 
              : `${displayResults.total} ${selectedResultType}${displayResults.total !== 1 ? 's' : ''}`
            }
          </h2>
          <p className="text-white/60 text-sm">
            {displayResults.total} result{displayResults.total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* View Mode Toggle - Only show for tracks and albums */}
        {(selectedResultType === "all" || selectedResultType === "track" || selectedResultType === "album") && (
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-all",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                viewMode === "list"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-all",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                viewMode === "grid"
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-8">
        {/* Top Results (only shown in "all" mode) */}
        {selectedResultType === "all" && (
          <>
            {/* Best Match */}
            {(displayResults.tracks.length > 0 || displayResults.artists.length > 0 || displayResults.albums.length > 0) && (
              <section>
                <h3 className="text-lg font-semibold text-white mb-4">Best match</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayResults.tracks[0] && (
                    <TrackCard
                      track={displayResults.tracks[0]}
                      variant="grid"
                      onPlay={handlePlayTrack}
                      onAddToQueue={handleAddToQueue}
                      onLike={handleLike}
                    />
                  )}
                  {displayResults.artists[0] && (
                    <ArtistCard
                      artist={displayResults.artists[0]}
                      variant="grid"
                      onPlay={handlePlayArtist}
                      onFollow={handleFollow}
                    />
                  )}
                  {displayResults.albums[0] && (
                    <AlbumCard
                      album={displayResults.albums[0]}
                      variant="grid"
                      onPlay={handlePlayAlbum}
                      onLike={handleLike}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Top Songs */}
            {displayResults.tracks.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Songs</h3>
                  {displayResults.tracks.length > 5 && (
                    <button
                      onClick={() => useSearchStore.getState().setSelectedResultType("track")}
                      className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                    >
                      Show all
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {displayResults.tracks.slice(0, 5).map((track, index) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      index={index}
                      variant="list"
                      onPlay={handlePlayTrack}
                      onAddToQueue={handleAddToQueue}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Top Artists */}
            {displayResults.artists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Artists</h3>
                  {displayResults.artists.length > 5 && (
                    <button
                      onClick={() => useSearchStore.getState().setSelectedResultType("artist")}
                      className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                    >
                      Show all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayResults.artists.slice(0, 5).map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      variant="grid"
                      onPlay={handlePlayArtist}
                      onFollow={handleFollow}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Top Albums */}
            {displayResults.albums.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Albums</h3>
                  {displayResults.albums.length > 5 && (
                    <button
                      onClick={() => useSearchStore.getState().setSelectedResultType("album")}
                      className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                    >
                      Show all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayResults.albums.slice(0, 5).map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      variant="grid"
                      onPlay={handlePlayAlbum}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Filtered Results */}
        {selectedResultType !== "all" && (
          <>
            {/* Tracks */}
            {selectedResultType === "track" && displayResults.tracks.length > 0 && (
              <section>
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-2"
                )}>
                  {displayResults.tracks.map((track, index) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      index={viewMode === "list" ? index : undefined}
                      variant={viewMode}
                      onPlay={handlePlayTrack}
                      onAddToQueue={handleAddToQueue}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Artists */}
            {selectedResultType === "artist" && displayResults.artists.length > 0 && (
              <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayResults.artists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      variant="grid"
                      onPlay={handlePlayArtist}
                      onFollow={handleFollow}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {selectedResultType === "album" && displayResults.albums.length > 0 && (
              <section>
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "space-y-2"
                )}>
                  {displayResults.albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      variant={viewMode}
                      onPlay={handlePlayAlbum}
                      onLike={handleLike}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}