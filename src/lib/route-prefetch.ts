/**
 * Utility for prefetching routes to improve navigation performance
 */

export const commonRoutes = [
  '/search',
  '/playlists',
  '/liked-songs',
  '/following',
] as const;

/**
 * Prefetch common navigation routes after app loads
 * This improves perceived performance when navigating
 */
export function prefetchCommonRoutes() {
  if (typeof window === 'undefined') return;
  
  // Wait for idle time to avoid blocking initial load
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      commonRoutes.forEach(route => {
        // Create a link element to trigger prefetch
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    });
  } else {
    // Fallback for Safari and older browsers
    setTimeout(() => {
      commonRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 2000);
  }
}

/**
 * Prefetch a specific route on hover/focus
 * Useful for improving perceived performance on user intent
 */
export function prefetchRoute(route: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  
  // Check if already prefetched
  const existing = document.querySelector(`link[rel="prefetch"][href="${route}"]`);
  if (!existing) {
    document.head.appendChild(link);
  }
}

/**
 * Hook to prefetch route on hover/focus
 */
export function usePrefetchRoute(route: string) {
  return {
    onMouseEnter: () => prefetchRoute(route),
    onFocus: () => prefetchRoute(route),
  };
}