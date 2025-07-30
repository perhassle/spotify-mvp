import { ApiError } from './api-error-handler';
import { ClientError } from './client-error-handler';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  environment: string;
  build?: string;
}

interface TrackedError {
  error: {
    name: string;
    message: string;
    stack?: string;
    type?: string;
    statusCode?: number;
    requestId?: string;
    details?: any;
  };
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
}

/**
 * Generate a fingerprint for error deduplication
 */
function generateErrorFingerprint(error: Error | ApiError | ClientError): string {
  const parts = [
    (error instanceof Error ? error.name : 'ClientError') || 'Error',
    error.message,
    error instanceof ApiError ? error.type.toString() : (error as ClientError).type || '',
    error instanceof ApiError ? error.statusCode : (error as ClientError).statusCode || '',
  ].filter(Boolean);
  
  return parts.join(':');
}

/**
 * Determine error severity
 */
function getErrorSeverity(error: Error | ApiError | ClientError): TrackedError['severity'] {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode >= 400 && error.statusCode < 500) return 'medium';
    return 'low';
  }
  
  // Check for specific error patterns
  if (error.message.includes('CRITICAL') || error.message.includes('FATAL')) {
    return 'critical';
  }
  
  if (error.message.includes('payment') || error.message.includes('subscription')) {
    return 'high';
  }
  
  return 'medium';
}

/**
 * Get error context from environment
 */
function getErrorContext(): ErrorContext {
  const context: ErrorContext = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  if (typeof window !== 'undefined') {
    context.url = window.location.href;
    context.userAgent = navigator.userAgent;
    context.sessionId = sessionStorage.getItem('sessionId') || undefined;
  }

  if (process.env.NEXT_PUBLIC_BUILD_ID) {
    context.build = process.env.NEXT_PUBLIC_BUILD_ID;
  }

  return context;
}

/**
 * Error tracking service interface
 */
interface ErrorTrackingService {
  track(error: TrackedError): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Console error tracking (for development)
 */
class ConsoleErrorTracking implements ErrorTrackingService {
  async track(error: TrackedError): Promise<void> {
    console.group(`🚨 ${error.severity.toUpperCase()} Error`);
    console.error('Error:', error.error);
    console.log('Context:', error.context);
    console.log('Fingerprint:', error.fingerprint);
    console.groupEnd();
  }

  async flush(): Promise<void> {
    // No-op for console tracking
  }
}

/**
 * Production error tracking service
 * Replace with your actual error tracking service (Sentry, Rollbar, etc.)
 */
class ProductionErrorTracking implements ErrorTrackingService {
  private queue: TrackedError[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  async track(error: TrackedError): Promise<void> {
    this.queue.push(error);
    
    // Batch errors and send them every 5 seconds
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), 5000);
    }
    
    // Send immediately if queue is large
    if (this.queue.length >= 10) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const errors = [...this.queue];
    this.queue = [];
    
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    
    try {
      // Send to your error tracking service
      // Example:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ errors }),
      // });
      
      console.log('Would send errors to tracking service:', errors);
    } catch (err) {
      console.error('Failed to send errors to tracking service:', err);
    }
  }
}

/**
 * Error tracking singleton
 */
class ErrorTracker {
  private service: ErrorTrackingService;
  private trackedFingerprints = new Set<string>();

  constructor() {
    this.service = process.env.NODE_ENV === 'production'
      ? new ProductionErrorTracking()
      : new ConsoleErrorTracking();
  }

  /**
   * Track an error
   */
  async track(error: Error | ApiError | ClientError | unknown): Promise<void> {
    try {
      const actualError = error instanceof Error ? error : new Error(String(error));
      const fingerprint = generateErrorFingerprint(actualError);
      
      // Deduplicate errors
      if (this.trackedFingerprints.has(fingerprint)) {
        return;
      }
      
      this.trackedFingerprints.add(fingerprint);
      
      // Clear fingerprint after 5 minutes
      setTimeout(() => {
        this.trackedFingerprints.delete(fingerprint);
      }, 5 * 60 * 1000);
      
      const trackedError: TrackedError = {
        error: {
          name: actualError.name,
          message: actualError.message,
          stack: actualError.stack,
          ...(actualError instanceof ApiError && {
            type: actualError.type.toString(),
            statusCode: actualError.statusCode,
            requestId: actualError.requestId,
            details: actualError.details,
          }),
          ...('statusCode' in actualError && {
            statusCode: Number((actualError as any).statusCode) || undefined,
          }),
          ...('type' in actualError && {
            type: (actualError as any).type?.toString(),
          }),
        },
        context: getErrorContext(),
        severity: getErrorSeverity(actualError),
        fingerprint,
      };
      
      await this.service.track(trackedError);
    } catch (err) {
      console.error('Failed to track error:', err);
    }
  }

  /**
   * Track error with additional context
   */
  async trackWithContext(
    error: Error | ApiError | ClientError | unknown,
    additionalContext: Record<string, any>
  ): Promise<void> {
    const actualError = error instanceof Error ? error : new Error(String(error));
    
    // Add context to error details
    if (actualError instanceof ApiError) {
      // Create a new error with merged details since details is readonly
      const newApiError = new ApiError(
        actualError.message,
        actualError.statusCode,
        actualError.type,
        { ...actualError.details, ...additionalContext }
      );
      newApiError.stack = actualError.stack;
      await this.track(newApiError);
      return;
    } else {
      (actualError as any).context = additionalContext;
    }
    
    await this.track(actualError);
  }

  /**
   * Flush any pending errors
   */
  async flush(): Promise<void> {
    await this.service.flush();
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

/**
 * React hook for error tracking
 */
export function useErrorTracking() {
  return {
    trackError: errorTracker.track.bind(errorTracker),
    trackErrorWithContext: errorTracker.trackWithContext.bind(errorTracker),
  };
}

/**
 * Error boundary error handler
 */
export function handleErrorBoundaryError(
  error: Error,
  errorInfo: React.ErrorInfo
): void {
  errorTracker.trackWithContext(error, {
    componentStack: errorInfo.componentStack,
    errorBoundary: true,
  });
}

/**
 * Global error handlers
 */
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.track(new Error(`Unhandled Promise Rejection: ${event.reason}`));
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorTracker.track(event.error || new Error(event.message));
  });

  // Flush errors before page unload
  window.addEventListener('beforeunload', () => {
    errorTracker.flush();
  });
}