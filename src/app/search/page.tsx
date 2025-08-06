import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "./search-page-client";
import { ErrorBoundaryWithFallback } from "@/components/common/error-boundary-with-fallback";

export const metadata: Metadata = {
  title: "Search - Spotify MVP",
  description: "Search for your favorite songs, artists, and albums. Discover new music and find exactly what you're looking for.",
  keywords: ["music search", "songs", "artists", "albums", "spotify", "music discovery"],
  openGraph: {
    title: "Search Music - Spotify MVP",
    description: "Search for your favorite songs, artists, and albums. Discover new music and find exactly what you're looking for.",
    type: "website",
    siteName: "Spotify MVP",
  },
  twitter: {
    card: "summary",
    title: "Search Music - Spotify MVP",
    description: "Search for your favorite songs, artists, and albums. Discover new music and find exactly what you're looking for.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <ErrorBoundaryWithFallback
      fallback={
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Search unavailable</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the search functionality. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-green-500 hover:text-green-400 underline"
          >
            Refresh page
          </button>
        </div>
      }
    >
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageClient />
      </Suspense>
    </ErrorBoundaryWithFallback>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black animate-pulse">
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-10 w-48 bg-gray-800 rounded mb-4" />
          <div className="max-w-2xl mx-auto">
            <div className="h-12 bg-gray-800 rounded" />
          </div>
        </div>
      </header>
    </div>
  );
}