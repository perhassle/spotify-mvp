# Performance Monitoring Implementation

## Overview

This document outlines the comprehensive performance monitoring implementation for the Spotify MVP application, including Core Web Vitals tracking, Real User Monitoring (RUM), and performance budgets.

## Core Components

### 1. Web Vitals Monitoring (`/src/lib/monitoring/web-vitals.ts`)
- Tracks all Core Web Vitals: LCP, FID, CLS, FCP, TTFB, INP
- Automatic rating based on Google's thresholds
- Batched reporting to reduce network overhead
- Session tracking for user journey analysis

### 2. Real User Monitoring (`/src/lib/monitoring/rum.ts`)
- Comprehensive user session tracking
- Page load performance metrics
- Resource timing analysis
- User interaction tracking
- Error monitoring integration
- Connection quality tracking

### 3. Performance Budgets (`/src/lib/monitoring/performance-budgets.ts`)
- Defined thresholds for all metrics
- Automatic budget validation
- Performance score calculation
- Support for custom metrics

### 4. Performance Hooks (`/src/lib/monitoring/performance-hooks.ts`)
- React component render performance tracking
- User interaction performance monitoring
- Data fetching performance analysis
- Long task detection
- Memory usage monitoring

## Implementation Details

### Monitoring Provider
The `MonitoringProvider` component initializes all monitoring systems:
- Web Vitals monitoring
- Error monitoring
- Sentry integration (production only)
- User context management

### Performance Monitor Component
The `PerformanceMonitor` component handles:
- RUM initialization
- Route change tracking
- Long task detection
- Memory usage monitoring (development)

### API Endpoints
- `/api/monitoring/web-vitals` - Receives Web Vitals data
- `/api/analytics/rum` - Receives RUM session data

## Performance Budgets

### Core Web Vitals Thresholds
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| TTFB | < 800ms | 800ms - 1.8s | > 1.8s |
| INP | < 200ms | 200ms - 500ms | > 500ms |

### Resource Budgets
- JavaScript: Warning at 300KB, Error at 500KB
- CSS: Warning at 100KB, Error at 200KB
- Total page weight: Warning at 1.5MB, Error at 3MB
- Request count: Warning at 50, Error at 100

## Usage in Components

### Track Component Performance
```typescript
import { useRenderPerformance } from '@/lib/monitoring/performance-hooks';

function MyComponent() {
  useRenderPerformance('MyComponent', {
    threshold: 16, // Log if render takes > 16ms
    metadata: { feature: 'music-player' }
  });
  
  return <div>...</div>;
}
```

### Track User Interactions
```typescript
import { useInteractionTracking } from '@/lib/monitoring/performance-hooks';

function PlayButton() {
  const { trackInteraction } = useInteractionTracking('play-button');
  
  const handleClick = trackInteraction(async () => {
    // Your interaction logic
  }, { songId: '123' });
  
  return <button onClick={handleClick}>Play</button>;
}
```

### Track Data Fetching
```typescript
import { useDataFetchPerformance } from '@/lib/monitoring/performance-hooks';

function SongList() {
  const { data, loading, error } = useDataFetchPerformance(
    'fetch-songs',
    async () => fetchSongs(),
    [userId]
  );
  
  return <div>...</div>;
}
```

## Monitoring Dashboard

In development mode, a monitoring dashboard is available in the bottom-right corner showing:
- Real-time Web Vitals metrics
- Error statistics
- Performance insights
- Memory usage

## Best Practices

1. **Sample Rate**: In production, use a 10% sample rate to reduce overhead
2. **Batch Reporting**: Metrics are batched and sent every 5 seconds
3. **Error Thresholds**: Same errors are rate-limited to 5 per minute
4. **Memory Monitoring**: Only enabled in development to avoid overhead

## Next Steps

1. **Set up monitoring backend**:
   - Time-series database (InfluxDB/TimescaleDB)
   - Analytics dashboard (Grafana/DataDog)
   - Alerting system

2. **Implement performance optimizations**:
   - Code splitting
   - Image optimization
   - Resource hints
   - Service Worker caching

3. **Create performance CI/CD checks**:
   - Lighthouse CI integration
   - Bundle size monitoring
   - Performance regression tests

## Troubleshooting

### Low Performance Score
1. Check Web Vitals in the monitoring dashboard
2. Look for budget violations in the console
3. Use Chrome DevTools Performance tab
4. Review long tasks in the RUM data

### Missing Metrics
1. Ensure MonitoringProvider is in the app layout
2. Check browser compatibility for specific metrics
3. Verify API endpoints are accessible
4. Check console for error messages

### High Memory Usage
1. Look for memory leaks in components
2. Check for large data structures
3. Review event listener cleanup
4. Use React DevTools Profiler