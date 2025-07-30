"use client";

import { MagnifyingGlassIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { MusicalNoteIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

// Loading State Component
export function SearchLoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      {/* Loading Animation */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-white/20 border-t-green-400 rounded-full animate-spin" />
        <MagnifyingGlassIcon className="w-6 h-6 text-white/60 absolute inset-0 m-auto" />
      </div>
      
      <h3 className="text-lg font-medium text-white mb-2">Searching...</h3>
      <p className="text-white/60 text-center max-w-md">
        Finding the perfect music for you
      </p>
    </div>
  );
}

// Empty State Component
interface SearchEmptyStateProps {
  query?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function SearchEmptyState({ 
  query, 
  hasFilters, 
  onClearFilters, 
  className 
}: SearchEmptyStateProps) {
  if (!query) {
    // Initial state - no search performed yet
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <MagnifyingGlassIcon className="w-12 h-12 text-white/40" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          Search for music
        </h3>
        <p className="text-white/60 text-center max-w-md mb-6">
          Find your favorite songs, artists, and albums. Start typing to discover new music.
        </p>
        
        {/* Popular searches */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-white/40 text-sm">Try:</span>
          {["Taylor Swift", "The Weeknd", "Billie Eilish", "Drake"].map((suggestion) => (
            <button
              key={suggestion}
              className={cn(
                "px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors",
                "text-sm text-white/80 hover:text-white",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // No results found
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
        <MusicalNoteIcon className="w-12 h-12 text-white/40" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        No results found
      </h3>
      <p className="text-white/60 text-center max-w-md mb-6">
        Sorry, we couldn't find any results for{" "}
        <span className="text-white font-medium">"{query}"</span>
        {hasFilters && " with the current filters"}.
      </p>
      
      <div className="space-y-3 text-center">
        <p className="text-white/60 text-sm">Try:</p>
        <ul className="text-white/60 text-sm space-y-1">
          <li>• Checking your spelling</li>
          <li>• Using different keywords</li>
          <li>• Searching for artist or song names</li>
          {hasFilters && (
            <li>
              • Removing filters{" "}
              {onClearFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-green-400 hover:text-green-300 underline focus:outline-none"
                >
                  Clear filters
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// Error State Component
interface SearchErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function SearchErrorState({ error, onRetry, className }: SearchErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        Something went wrong
      </h3>
      <p className="text-white/60 text-center max-w-md mb-6">
        {error || "We encountered an error while searching. Please try again."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "px-6 py-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors",
            "text-black font-medium",
            "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent",
            "min-h-[44px]" // Minimum touch target size
          )}
        >
          Try again
        </button>
      )}
    </div>
  );
}

// Loading Skeleton Components
export function TrackSkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          {/* Album artwork skeleton */}
          <div className="w-12 h-12 bg-white/10 rounded-md animate-pulse" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
          </div>
          
          {/* Duration skeleton */}
          <div className="h-3 bg-white/10 rounded animate-pulse w-12" />
        </div>
      ))}
    </div>
  );
}

export function ArtistSkeletonLoader({ count = 4, variant = "grid" }: { count?: number; variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
            {/* Artist image skeleton */}
            <div className="w-14 h-14 bg-white/10 rounded-full animate-pulse" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-1/3" />
            </div>
            
            {/* Follow button skeleton */}
            <div className="h-8 bg-white/10 rounded-full animate-pulse w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-lg bg-white/5 text-center">
          {/* Artist image skeleton */}
          <div className="w-32 h-32 bg-white/10 rounded-full mx-auto mb-4 animate-pulse" />
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4 mx-auto" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-1/2 mx-auto" />
            <div className="h-8 bg-white/10 rounded-full animate-pulse w-24 mx-auto mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AlbumSkeletonLoader({ count = 4, variant = "grid" }: { count?: number; variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
            {/* Album artwork skeleton */}
            <div className="w-14 h-14 bg-white/10 rounded-md animate-pulse" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
            </div>
            
            {/* Heart button skeleton */}
            <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg bg-white/5">
          {/* Album artwork skeleton */}
          <div className="aspect-square bg-white/10 rounded-lg mb-4 animate-pulse" />
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}