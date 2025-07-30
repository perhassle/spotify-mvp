/**
 * Sentry stub for when @sentry/nextjs is not installed
 * Provides the same API but does nothing
 */

import { ErrorCategory, ErrorSeverity } from './error-monitoring';

// Sentry configuration (for when it's installed)
export const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  autoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.9 : 1.0,
};

// Stub initialization
export function initSentry(): void {
  console.log('Sentry is not installed. To enable error tracking, install @sentry/nextjs');
}

// Stub utilities
export const sentryUtils = {
  setUser(user: any) {
    // No-op
  },
  clearUser() {
    // No-op
  },
  setTags(tags: Record<string, string>) {
    // No-op
  },
  addBreadcrumb(breadcrumb: any) {
    // No-op
  },
  captureEvent(message: string, level: string = 'info') {
    // No-op
  },
  startTransaction(name: string, op: string) {
    return null;
  },
};