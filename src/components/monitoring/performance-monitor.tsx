/**
 * Performance Monitor Component
 * Initializes and manages performance monitoring
 */

'use client';

import { useEffect } from 'react';
import { webVitalsMonitor } from '@/lib/monitoring/web-vitals';
import { getRUM } from '@/lib/monitoring/rum';
import { usePathname } from 'next/navigation';
import { clientLogger } from '@/lib/client-logger';

interface PerformanceMonitorProps {
  userId?: string;
  enableRUM?: boolean;
  enableWebVitals?: boolean;
  sampleRate?: number;
}

export function PerformanceMonitor({
  userId,
  enableRUM = true,
  enableWebVitals = true,
  sampleRate = 1,
}: PerformanceMonitorProps) {
  const pathname = usePathname();

  // Initialize monitoring systems
  useEffect(() => {
    // Initialize Web Vitals monitoring
    if (enableWebVitals) {
      webVitalsMonitor.init();
      clientLogger.info('Web Vitals monitoring initialized');
    }

    // Initialize RUM
    if (enableRUM) {
      const rumInstance = getRUM();
      if (rumInstance) {
        rumInstance.init();
        if (userId) {
          rumInstance.setUser(userId);
        }
        clientLogger.info('RUM initialized');
      }
    }

    // Track initial page metrics
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;
      
      // Log initial performance metrics
      window.addEventListener('load', () => {
        const loadTime = timing.loadEventEnd - navigationStart;
        const domReady = timing.domContentLoadedEventEnd - navigationStart;
        
        clientLogger.info('Initial page performance', {
          performance: {
            loadTime,
            domReady,
            firstByte: timing.responseStart - navigationStart,
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
          },
        });
      });
    }
  }, [enableWebVitals, enableRUM, userId]);

  // Track route changes
  useEffect(() => {
    if (enableRUM) {
      const rumInstance = getRUM();
      if (rumInstance) {
        rumInstance.trackCustomMetric('route-change', Date.now(), {
          pathname,
          previousPath: document.referrer,
        });
      }
    }
  }, [pathname, enableRUM]);

  // Monitor long tasks
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          clientLogger.warn('Long task detected', {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          });

          if (enableRUM) {
            const rumInstance = getRUM();
            if (rumInstance) {
              rumInstance.trackCustomMetric('long-task', entry.duration, {
                startTime: entry.startTime,
              });
            }
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported
    }

    return () => observer.disconnect();
  }, [enableRUM]);

  // Monitor memory usage (Chrome only)
  useEffect(() => {
    const performance = window.performance as any;
    if (!performance.memory || process.env.NODE_ENV !== 'development') return;

    const checkMemory = () => {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      if (usagePercentage > 90) {
        clientLogger.warn('High memory usage', {
          used: Math.round(usedJSHeapSize / 1048576), // MB
          total: Math.round(totalJSHeapSize / 1048576),
          limit: Math.round(jsHeapSizeLimit / 1048576),
          percentage: Math.round(usagePercentage),
        });
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}