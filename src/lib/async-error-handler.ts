/**
 * Utility for handling errors in event handlers and async code
 * Since error boundaries don't catch these types of errors
 */

import { errorMonitor } from '@/lib/monitoring/error-monitoring';

interface ErrorHandlerOptions<T> {
  fallback?: T;
  showToast?: boolean;
  context?: Record<string, unknown>;
}

/**
 * Wraps async functions to handle errors gracefully
 * Logs errors to monitoring service and provides fallback values
 */
export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  options?: ErrorHandlerOptions<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    errorMonitor.captureError(error as Error, options?.context);
    
    if (options?.showToast) {
      // Show toast notification (would integrate with actual toast system)
      console.warn('An error occurred. Please try again.');
    }
    
    if (options?.fallback !== undefined) {
      return options.fallback;
    }
    
    throw error;
  }
}

/**
 * Wraps synchronous functions to handle errors gracefully
 */
export function withSyncErrorHandler<T>(
  fn: () => T,
  options?: ErrorHandlerOptions<T>
): T {
  try {
    return fn();
  } catch (error) {
    errorMonitor.captureError(error as Error, options?.context);
    
    if (options?.showToast) {
      console.warn('An error occurred. Please try again.');
    }
    
    if (options?.fallback !== undefined) {
      return options.fallback;
    }
    
    throw error;
  }
}

/**
 * Creates an error handler for event handlers
 * Returns a function that can be used as an event handler
 */
export function createEventErrorHandler<T extends unknown[]>(
  fn: (...args: T) => void | Promise<void>,
  options?: Omit<ErrorHandlerOptions<void>, 'fallback'>
) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      errorMonitor.captureError(error as Error, options?.context);
      
      if (options?.showToast) {
        console.warn('An error occurred. Please try again.');
      }
    }
  };
}

/**
 * Hook for handling async errors in React components
 * Can be used to manually trigger error boundaries
 */
export function useAsyncErrorHandler() {
  return (error: Error, context?: Record<string, unknown>) => {
    errorMonitor.captureError(error, context);
    throw error; // Re-throw to trigger error boundary
  };
}