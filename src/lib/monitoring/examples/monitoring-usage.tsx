/**
 * Example usage of monitoring hooks and utilities
 * This file demonstrates how to integrate monitoring in components
 */

'use client';

import { useEffect } from 'react';
import { webVitalsMonitor } from '../web-vitals';
import {
  useRenderPerformance,
  useInteractionTracking,
  useDataFetchPerformance,
  usePerformanceMeasure,
  useLongTaskMonitoring,
  useMemoryMonitoring,
} from '../performance-hooks';
import { useMonitoring } from '../monitoring-provider';
import { ErrorBoundary } from '../error-monitoring';
import { clientLogger } from '@/lib/client-logger';

// Example component with comprehensive monitoring
export function MonitoredMusicPlayer() {
  // Component render performance tracking
  useRenderPerformance('MusicPlayer', {
    threshold: 20, // Log if render takes more than 20ms
    metadata: { version: '1.0.0' },
  });

  // Long task monitoring
  useLongTaskMonitoring('MusicPlayer', 50);

  // Memory monitoring
  const { memoryInfo } = useMemoryMonitoring('MusicPlayer');

  // Interaction tracking
  const { trackInteraction } = useInteractionTracking('play-button');

  // Custom performance measurement
  const { measureAsync } = usePerformanceMeasure('audio-load');

  // General monitoring utilities
  const { logEvent, logError, logPerformance } = useMonitoring();

  // Track play button clicks with performance monitoring
  const handlePlay = trackInteraction(async () => {
    try {
      logEvent('music-play-clicked', { trackId: 'abc123' });
      
      // Measure audio loading performance
      const audioData = await measureAsync(async () => {
        // Simulate loading audio
        const response = await fetch('/api/tracks/abc123/stream');
        return response.blob();
      }, { trackId: 'abc123' });

      // Start playback
      console.log('Playing audio...');
    } catch (error) {
      logError(error as Error, { action: 'play-track' });
    }
  }, { buttonType: 'primary' });

  return (
    <div className="p-4">
      <h2>Monitored Music Player Example</h2>
      
      {/* Memory usage display (Chrome only) */}
      {memoryInfo && (
        <div className="text-sm text-gray-500 mb-2">
          Memory: {memoryInfo.used}MB / {memoryInfo.limit}MB ({memoryInfo.percentage}%)
        </div>
      )}

      <button
        onClick={handlePlay}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Play Track
      </button>
    </div>
  );
}

// Example of data fetching with performance monitoring
export function MonitoredTrackList() {
  const { data, loading, error, refetch } = useDataFetchPerformance(
    'fetch-tracks',
    async () => {
      const response = await fetch('/api/tracks');
      if (!response.ok) throw new Error('Failed to fetch tracks');
      return response.json();
    },
    [] // Dependencies
  );

  if (loading) return <div>Loading tracks...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Tracks</h3>
      <button onClick={refetch}>Refresh</button>
      {/* Render tracks */}
    </div>
  );
}

// Example of custom error boundary with monitoring
export function MonitoredSection({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-bold">Something went wrong</h3>
          <p className="text-red-600">{error.message}</p>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Example of manual performance tracking
export function SearchWithMonitoring() {
  const { startMeasure, endMeasure } = usePerformanceMeasure('search-operation');
  const logger = clientLogger.child({ component: 'Search' });

  const handleSearch = async (query: string) => {
    startMeasure({ query });
    logger.info('Search started', { query });

    try {
      // Simulate search
      const results = await fetch(`/api/search?q=${query}`);
      const data = await results.json();
      
      endMeasure({ resultCount: data.length, success: true });
      logger.info('Search completed', { query, resultCount: data.length });
      
      return data;
    } catch (error) {
      endMeasure({ success: false });
      logger.error('Search failed', error as Error, { query });
      throw error;
    }
  };

  return (
    <div>
      <input
        type="search"
        placeholder="Search..."
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}

// Example of Web Vitals usage
export function WebVitalsDisplay() {
  useEffect(() => {
    // Web Vitals are automatically tracked by MonitoringProvider
    // This is just an example of how to access the monitor directly
    
    // Get current metrics summary
    const summary = webVitalsMonitor.getMetricsSummary();
    console.log('Current Web Vitals:', summary);
  }, []);

  return <div>Web Vitals are being tracked automatically</div>;
}