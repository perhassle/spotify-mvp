"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { SearchInput } from "@/components/features/search/search-input";
import { useSearchStore } from "@/stores/search-store";
import { cn } from "@/lib/utils";

// Lazy load non-critical components
const SearchResults = dynamic(
  () => import("@/components/features/search/search-results").then(mod => ({ default: mod.SearchResults })),
  {
    loading: () => <div className="animate-pulse bg-gray-800 h-64 rounded-lg" aria-label="Loading search results..." />,
  }
);

const SearchHistory = dynamic(
  () => import("@/components/features/search/search-history").then(mod => ({ default: mod.SearchHistory })),
  {
    loading: () => <div className="animate-pulse bg-gray-800 h-32 rounded-lg" aria-label="Loading search history..." />,
  }
);

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const { query, performSearch, setQuery } = useSearchStore();
  
  // Handle URL search params
  useEffect(() => {
    const urlQuery = searchParams?.get("q");
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, [searchParams, query, setQuery, performSearch]);

  // Handle search submission
  const handleSearchSubmit = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Update URL without causing a page reload
      const newUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      window.history.pushState(null, "", newUrl);
      
      // Perform search
      performSearch(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-white mb-4">Search Music</h1>
          <div className="max-w-2xl mx-auto">
            <SearchInput
              placeholder="What do you want to listen to?"
              autoFocus
              onSubmit={handleSearchSubmit}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Results */}
          <div className="lg:col-span-3">
            <SearchResults />
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1" aria-label="Search options and history">
            <div className="sticky top-24 space-y-6">
              {/* Search History */}
              {!query && (
                <section className="bg-white/5 rounded-lg p-6">
                  <SearchHistory onSearchSelect={handleSearchSubmit} />
                </section>
              )}

              {/* Quick Filters - Could add genre shortcuts, mood playlists, etc. */}
              {!query && (
                <section className="bg-white/5 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Browse all</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { name: "Pop", color: "from-pink-500 to-purple-500" },
                      { name: "Hip Hop", color: "from-orange-500 to-red-500" },
                      { name: "Rock", color: "from-blue-500 to-purple-500" },
                      { name: "R&B", color: "from-green-500 to-blue-500" },
                      { name: "Electronic", color: "from-purple-500 to-pink-500" },
                      { name: "Jazz", color: "from-yellow-500 to-orange-500" },
                    ].map((genre) => (
                      <button
                        key={genre.name}
                        onClick={() => handleSearchSubmit(genre.name)}
                        className={cn(
                          "relative p-4 rounded-lg text-white font-semibold text-left overflow-hidden",
                          "hover:scale-105 transition-transform duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900",
                          "min-h-[44px]" // Minimum touch target size
                        )}
                        aria-label={`Search for ${genre.name} music`}
                      >
                        <div className={cn("absolute inset-0 bg-gradient-to-br", genre.color)} />
                        <span className="relative z-10">{genre.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Popular Searches */}
              {!query && (
                <section className="bg-white/5 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Popular searches</h2>
                  <div className="space-y-2">
                    {[
                      "Taylor Swift",
                      "The Weeknd",
                      "Billie Eilish",
                      "Drake",
                      "Ariana Grande",
                    ].map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearchSubmit(search)}
                        className={cn(
                          "w-full text-left p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors",
                          "focus:outline-none focus:bg-white/10 focus:text-white",
                          "min-h-[44px]" // Minimum touch target size
                        )}
                        aria-label={`Search for ${search}`}
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}