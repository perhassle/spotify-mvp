/**
 * Performance monitoring hooks for React components
 * Provides utilities to track component render times, interactions, and data fetching
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { clientLogger } from '../client-logger';
import { reportCustomMetric } from './web-vitals';

// Performance mark types
type _PerformanceMarkType = 'component-mount' | 'component-update' | 'interaction' | 'data-fetch';

// Memory info interface
interface PerformanceMemory {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

// Performance monitoring options
interface PerformanceOptions {
  threshold?: number; // Log only if duration exceeds threshold (ms)
  logLevel?: 'info' | 'warn';
  metadata?: Record<string, unknown>;
}

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(
  componentName: string,
  options: PerformanceOptions = {}
): void {
  const { threshold = 16, logLevel = 'info' } = options; // 16ms = 60fps
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    
    // Component mount
    if (renderCount.current === 0) {
      mountTime.current = startTime;
      const currentRenderCount = renderCount.current; // Capture the value
      
      // Create performance mark
      if (performance.mark) {
        performance.mark(`${componentName}-mount-start`);
      }
      
      return () => {
        const mountDuration = performance.now() - mountTime.current;
        const currentRenderCount = renderCount.current;
        
        if (performance.mark && performance.measure) {
          performance.mark(`${componentName}-mount-end`);
          performance.measure(
            `${componentName}-mount`,
            `${componentName}-mount-start`,
            `${componentName}-mount-end`
          );
        }
        
        if (mountDuration > threshold) {
          const logger = logLevel === 'warn' ? clientLogger.warn : clientLogger.info;
          logger.call(clientLogger, `Component mount: ${componentName}`, {
            performance: {
              type: 'component-mount',
              component: componentName,
              duration: Math.round(mountDuration),
              renderCount: currentRenderCount,
              ...options.metadata,
            },
          });
        }
      };
    }
    
    // Component update
    const updateDuration = startTime - lastRenderTime.current;
    if (renderCount.current > 0 && updateDuration > threshold) {
      clientLogger.performance(`Component update: ${componentName}`, updateDuration, {
        component: componentName,
        renderCount: renderCount.current,
        ...options.metadata,
      });
    }
    
    lastRenderTime.current = startTime;
    renderCount.current++;
    
    // No cleanup needed for updates
    return undefined;
  }, [componentName, threshold, options.metadata, logLevel]);
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking(
  interactionName: string,
  options: PerformanceOptions = {}
): {
  trackInteraction: <T extends (...args: unknown[]) => unknown>(
    handler: T,
    metadata?: Record<string, unknown>
  ) => T;
} {
  const { threshold = 100 } = options;

  const trackInteraction = useCallback(<T extends (...args: unknown[]) => unknown>(
    handler: T,
    metadata?: Record<string, unknown>
  ): T => {
    return ((...args: unknown[]) => {
      const startTime = performance.now();
      const markName = `interaction-${interactionName}-${Date.now()}`;
      
      if (performance.mark) {
        performance.mark(`${markName}-start`);
      }
      
      try {
        const result = handler(...args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            const duration = performance.now() - startTime;
            
            if (performance.mark && performance.measure) {
              performance.mark(`${markName}-end`);
              performance.measure(markName, `${markName}-start`, `${markName}-end`);
            }
            
            if (duration > threshold) {
              reportCustomMetric(`interaction-${interactionName}`, duration, {
                type: 'interaction',
                ...metadata,
                ...options.metadata,
              });
            }
          });
        }
        
        // Sync function
        const duration = performance.now() - startTime;
        
        if (duration > threshold) {
          reportCustomMetric(`interaction-${interactionName}`, duration, {
            type: 'interaction',
            ...metadata,
            ...options.metadata,
          });
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        clientLogger.error(`Interaction failed: ${interactionName}`, error, {
          duration,
          ...metadata,
        });
        throw error;
      }
    }) as T;
  }, [interactionName, threshold, options.metadata]);

  return { trackInteraction };
}

/**
 * Hook to monitor data fetching performance
 */
export function useDataFetchPerformance<T>(
  fetchName: string,
  fetcher: () => Promise<T>,
  dependencies: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const performFetch = useCallback(async () => {
    const startTime = performance.now();
    const markName = `fetch-${fetchName}-${Date.now()}`;
    
    setLoading(true);
    setError(null);
    
    if (performance.mark) {
      performance.mark(`${markName}-start`);
    }
    
    try {
      const result = await fetcher();
      const duration = performance.now() - startTime;
      
      if (performance.mark && performance.measure) {
        performance.mark(`${markName}-end`);
        performance.measure(markName, `${markName}-start`, `${markName}-end`);
      }
      
      setData(result);
      
      reportCustomMetric(`data-fetch-${fetchName}`, duration, {
        type: 'data-fetch',
        success: true,
      });
      
      return result;
    } catch (err) {
      const duration = performance.now() - startTime;
      const error = err instanceof Error ? err : new Error(String(err));
      
      setError(error);
      
      clientLogger.error(`Data fetch failed: ${fetchName}`, error, {
        duration,
        type: 'data-fetch',
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchName, fetcher]);

  useEffect(() => {
    performFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performFetch, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: performFetch,
  };
}

/**
 * Hook to create custom performance measurements
 */
export function usePerformanceMeasure(
  measureName: string
): {
  startMeasure: (metadata?: Record<string, any>) => void;
  endMeasure: (metadata?: Record<string, any>) => void;
  measureAsync: <T>(operation: () => Promise<T>, metadata?: Record<string, any>) => Promise<T>;
} {
  const measureIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startMeasure = useCallback((metadata?: Record<string, any>) => {
    measureIdRef.current = `${measureName}-${Date.now()}`;
    startTimeRef.current = performance.now();
    
    if (performance.mark) {
      performance.mark(`${measureIdRef.current}-start`);
    }
    
    clientLogger.debug(`Performance measure started: ${measureName}`, metadata);
  }, [measureName]);

  const endMeasure = useCallback((metadata?: Record<string, any>) => {
    if (!startTimeRef.current || !measureIdRef.current) {
      clientLogger.warn('endMeasure called without startMeasure');
      return;
    }
    
    const duration = performance.now() - startTimeRef.current;
    
    if (performance.mark && performance.measure) {
      performance.mark(`${measureIdRef.current}-end`);
      performance.measure(
        measureIdRef.current,
        `${measureIdRef.current}-start`,
        `${measureIdRef.current}-end`
      );
    }
    
    reportCustomMetric(measureName, duration, metadata);
    
    // Reset
    measureIdRef.current = null;
    startTimeRef.current = null;
  }, [measureName]);

  const measureAsync = useCallback(async <T,>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    startMeasure(metadata);
    try {
      const result = await operation();
      endMeasure({ ...metadata, success: true });
      return result;
    } catch (error) {
      endMeasure({ ...metadata, success: false, error: String(error) });
      throw error;
    }
  }, [startMeasure, endMeasure]);

  return { startMeasure, endMeasure, measureAsync };
}

/**
 * Hook to monitor long tasks and potential jank
 */
export function useLongTaskMonitoring(
  componentName: string,
  threshold: number = 50 // 50ms is considered a long task
): void {
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          clientLogger.warn('Long task detected', {
            performance: {
              type: 'long-task',
              component: componentName,
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime),
              name: entry.name,
            },
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // Long task monitoring not supported
      clientLogger.debug('Long task monitoring not supported');
    }

    return () => observer.disconnect();
  }, [componentName, threshold]);
}

/**
 * Hook to track memory usage (experimental)
 */
export function useMemoryMonitoring(
  componentName: string,
  interval: number = 10000 // Check every 10 seconds
): { memoryInfo: PerformanceMemory | null } {
  const [memoryInfo, setMemoryInfo] = useState<PerformanceMemory | null>(null);

  useEffect(() => {
    // Check if memory API is available (Chrome only)
    const performance = window.performance as any;
    if (!performance.memory) return;

    const checkMemory = () => {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const memoryUsage = {
        used: Math.round(usedJSHeapSize / 1048576), // Convert to MB
        total: Math.round(totalJSHeapSize / 1048576),
        limit: Math.round(jsHeapSizeLimit / 1048576),
        percentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100),
      };

      setMemoryInfo(memoryUsage as any);

      // Log if memory usage is high
      if (memoryUsage.percentage > 90) {
        clientLogger.warn('High memory usage detected', {
          performance: {
            type: 'memory',
            component: componentName,
            ...memoryUsage,
          },
        });
      }
    };

    checkMemory(); // Initial check
    const intervalId = setInterval(checkMemory, interval);

    return () => clearInterval(intervalId);
  }, [componentName, interval]);

  return { memoryInfo };
}