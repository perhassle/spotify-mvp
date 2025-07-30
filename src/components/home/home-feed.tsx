"use client";

import React, { useEffect, useRef } from 'react';
import { useHomeFeedStore } from '@/stores/home-feed-store';
import { useAuthStore } from '@/stores/auth-store';
import { HomeFeedSection } from './home-feed-section';
import { HomeFeedSkeleton } from './home-feed-skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function HomeFeed() {
  const { user } = useAuthStore();
  const { 
    homeFeed, 
    isLoading, 
    error, 
    loadHomeFeed, 
    refreshHomeFeed, 
    clearError 
  } = useHomeFeedStore();

  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !homeFeed && !isLoading) {
      loadHomeFeed(user.id);
    }
  }, [user, homeFeed, isLoading, loadHomeFeed]);

  const handleRefresh = async () => {
    if (user) {
      await refreshHomeFeed(user.id);
      // Scroll to top after refresh
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleRetry = async () => {
    clearError();
    if (user) {
      await loadHomeFeed(user.id, true);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Your Music Feed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to get personalized music recommendations
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <Button 
            onClick={handleRetry}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !homeFeed) {
    return <HomeFeedSkeleton />;
  }

  return (
    <div 
      ref={feedRef}
      className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      role="main"
      aria-label="Personalized music feed"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Good {getGreeting()}, {user.displayName.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {homeFeed.metadata.totalRecommendations} personalized recommendations
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoading}
            aria-label="Refresh recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="pb-32"> {/* Extra padding for player */}
        {homeFeed.sections.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh] p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No recommendations yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start listening to music to get personalized recommendations
              </p>
              <Button 
                onClick={handleRefresh}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Discover Music
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {homeFeed.sections.map((section) => (
              <HomeFeedSection 
                key={section.id} 
                section={section}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feed Metadata (Debug info - only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg max-w-xs">
          <div>Confidence: {(homeFeed.metadata.averageConfidence * 100).toFixed(1)}%</div>
          <div>Diversity: {(homeFeed.metadata.diversityScore * 100).toFixed(1)}%</div>
          <div>Freshness: {(homeFeed.metadata.freshnessScore * 100).toFixed(1)}%</div>
          <div>Generated: {homeFeed.generatedAt.toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}