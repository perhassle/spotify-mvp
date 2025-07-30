/**
 * Monitoring Provider Component
 * Initializes and manages all monitoring systems
 */

'use client';

import { useEffect } from 'react';
import { webVitalsMonitor } from './web-vitals';
import { errorMonitor } from './error-monitoring';
import { usePathname } from 'next/navigation';
import { clientLogger } from '../client-logger';

interface MonitoringProviderProps {
  children: React.ReactNode;
  enableSentry?: boolean;
  enableWebVitals?: boolean;
  enableErrorMonitoring?: boolean;
  userId?: string;
  userEmail?: string;
}

export function MonitoringProvider({
  children,
  enableSentry = true,
  enableWebVitals = true,
  enableErrorMonitoring = true,
  userId,
  userEmail,
}: MonitoringProviderProps) {
  const pathname = usePathname();

  // Initialize monitoring systems
  useEffect(() => {
    // Initialize error monitoring
    if (enableErrorMonitoring) {
      errorMonitor.init();
      clientLogger.info('Error monitoring initialized');
    }

    // Initialize Web Vitals
    if (enableWebVitals) {
      webVitalsMonitor.init();
      clientLogger.info('Web Vitals monitoring initialized');
    }

    // Initialize Sentry (only if DSN is configured)
    if (enableSentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Dynamic import to avoid build errors when Sentry is not installed
      import('./sentry-config').then(({ initSentry }) => {
        initSentry();
        clientLogger.info('Sentry monitoring initialized');
      }).catch(() => {
        clientLogger.info('Sentry not available, skipping initialization');
      });
    }

    // Set user context if available
    if (userId) {
      const userContext = {
        id: userId,
        email: userEmail,
      };

      // Update client logger context
      clientLogger.child({ userId, userEmail });

      // Update Sentry user context
      if ((window as any).Sentry) {
        (window as any).Sentry.setUser(userContext);
      }
    }

    // Log app initialization
    clientLogger.info('Application initialized', {
      monitoring: {
        errorMonitoring: enableErrorMonitoring,
        webVitals: enableWebVitals,
        sentry: enableSentry && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      },
    });
  }, [enableSentry, enableWebVitals, enableErrorMonitoring, userId, userEmail]);

  // Track page views
  useEffect(() => {
    clientLogger.info('Page view', {
      page: pathname,
      referrer: document.referrer,
    });

    // Add breadcrumb for Sentry
    if ((window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${pathname}`,
        level: 'info',
      });
    }
  }, [pathname]);

  // Monitor page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      clientLogger.info('Page visibility changed', {
        visibility: document.visibilityState,
        hidden: document.hidden,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      clientLogger.info('Connection status changed', { online: true });
    };

    const handleOffline = () => {
      clientLogger.warn('Connection status changed', { online: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}

// Hook to use monitoring utilities
export function useMonitoring() {
  return {
    logEvent: (eventName: string, data?: Record<string, unknown>) => {
      clientLogger.info(`Event: ${eventName}`, { event: { name: eventName, ...data } });
      
      if ((window as any).Sentry) {
        (window as any).Sentry.addBreadcrumb({
          category: 'user-action',
          message: eventName,
          data,
          level: 'info',
        });
      }
    },
    
    logError: (error: Error, context?: Record<string, unknown>) => {
      errorMonitor.captureError(error, context);
    },
    
    logPerformance: (operation: string, duration: number, metadata?: Record<string, unknown>) => {
      clientLogger.performance(operation, duration, metadata);
    },
    
    setUserContext: (user: { id: string; email?: string; [key: string]: unknown }) => {
      clientLogger.child({ userId: user.id, userEmail: user.email });
      
      if ((window as any).Sentry) {
        (window as any).Sentry.setUser(user);
      }
    },
    
    clearUserContext: () => {
      if ((window as any).Sentry) {
        (window as any).Sentry.setUser(null);
      }
    },
  };
}