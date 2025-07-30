"use client";

import { useState } from "react";
import { FunnelIcon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useSearchStore } from "@/stores/search-store";
import type { SearchFilters } from "@/types";
import { cn } from "@/lib/utils";

interface SearchFiltersComponentProps {
  className?: string;
  compact?: boolean;
}

const RESULT_TYPES = [
  { value: "all", label: "All" },
  { value: "track", label: "Songs" },
  { value: "artist", label: "Artists" },
  { value: "album", label: "Albums" },
  { value: "playlist", label: "Playlists" },
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "release_date", label: "Release Date" },
  { value: "alphabetical", label: "A-Z" },
] as const;

const GENRES = [
  "Pop", "Rock", "Hip Hop", "R&B", "Country", "Electronic", "Jazz", "Classical",
  "Folk", "Reggae", "Blues", "Alternative", "Indie", "Metal", "Punk", "Funk",
  "Soul", "Dance", "House", "Techno", "Disco", "Reggaeton", "Latin", "World"
];

export function SearchFiltersComponent({ className, compact = false }: SearchFiltersComponentProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const { filters, setFilters, resetFilters, selectedResultType, setSelectedResultType } = useSearchStore();

  // Check if any filters are active
  const hasActiveFilters = filters.genre || filters.year || filters.explicit !== undefined || filters.sortBy !== "relevance";

  // Handle result type change
  const handleResultTypeChange = (type: typeof RESULT_TYPES[number]["value"]) => {
    setSelectedResultType(type);
    setFilters({ type });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(newFilters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    resetFilters();
    setSelectedResultType("all");
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 overflow-x-auto pb-2", className)}>
        {/* Result Type Chips */}
        <div className="flex gap-2 flex-shrink-0">
          {RESULT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleResultTypeChange(type.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                "min-h-[44px] min-w-[60px]", // Minimum touch target size
                selectedResultType === type.value
                  ? "bg-green-500 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
              aria-pressed={selectedResultType === type.value}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
            "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
            "min-h-[44px]", // Minimum touch target size
            hasActiveFilters
              ? "bg-green-500 text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-expanded={showAdvanced}
        >
          <FunnelIcon className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-current rounded-full" />
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              "text-white/60 hover:text-white hover:bg-white/10",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
              "min-h-[44px]" // Minimum touch target size
            )}
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Result Type Filter */}
      <div>
        <h3 className="text-sm font-medium text-white mb-2">Show</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {RESULT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleResultTypeChange(type.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                "min-h-[44px]", // Minimum touch target size
                selectedResultType === type.value
                  ? "bg-green-500 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
              aria-pressed={selectedResultType === type.value}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium text-white hover:text-green-400 transition-colors",
            "focus:outline-none focus:text-green-400"
          )}
          aria-expanded={showAdvanced}
        >
          <FunnelIcon className="w-4 h-4" />
          Advanced Filters
          <ChevronDownIcon 
            className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} 
          />
        </button>

        {showAdvanced && (
          <div className="space-y-4 pl-6 border-l border-white/10">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Genre
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg",
                    "bg-white/10 text-white hover:bg-white/20 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                    "min-h-[44px]" // Minimum touch target size
                  )}
                  aria-expanded={showGenreDropdown}
                >
                  <span className="text-sm">
                    {filters.genre || "All genres"}
                  </span>
                  <ChevronDownIcon 
                    className={cn("w-4 h-4 transition-transform", showGenreDropdown && "rotate-180")} 
                  />
                </button>

                {showGenreDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
                    <button
                      onClick={() => {
                        handleFilterChange({ genre: undefined });
                        setShowGenreDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      All genres
                    </button>
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => {
                          handleFilterChange({ genre });
                          setShowGenreDropdown(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm transition-colors",
                          filters.genre === genre
                            ? "bg-green-500 text-black"
                            : "text-white hover:bg-white/10"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Year Filter */}
            <div>
              <label htmlFor="year-filter" className="block text-sm font-medium text-white mb-2">
                Release Year
              </label>
              <input
                id="year-filter"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={filters.year || ""}
                onChange={(e) => handleFilterChange({ 
                  year: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Any year"
                className={cn(
                  "w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/60",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                  "min-h-[44px]" // Minimum touch target size
                )}
              />
            </div>

            {/* Explicit Content Filter */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Explicit Content
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: undefined, label: "All" },
                  { value: false, label: "Clean" },
                  { value: true, label: "Explicit" },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    onClick={() => handleFilterChange({ explicit: option.value })}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                      "min-h-[44px]", // Minimum touch target size
                      filters.explicit === option.value
                        ? "bg-green-500 text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    aria-pressed={filters.explicit === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sort By
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg",
                    "bg-white/10 text-white hover:bg-white/20 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
                    "min-h-[44px]" // Minimum touch target size
                  )}
                  aria-expanded={showSortDropdown}
                >
                  <span className="text-sm">
                    {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label || "Relevance"}
                  </span>
                  <ChevronDownIcon 
                    className={cn("w-4 h-4 transition-transform", showSortDropdown && "rotate-180")} 
                  />
                </button>

                {showSortDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFilterChange({ sortBy: option.value });
                          setShowSortDropdown(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm transition-colors",
                          filters.sortBy === option.value
                            ? "bg-green-500 text-black"
                            : "text-white hover:bg-white/10"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "text-white/60 hover:text-white hover:bg-white/10",
            "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
            "min-h-[44px]" // Minimum touch target size
          )}
        >
          <XMarkIcon className="w-4 h-4" />
          Clear all filters
        </button>
      )}
    </div>
  );
}