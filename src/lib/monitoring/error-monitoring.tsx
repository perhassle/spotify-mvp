/**
 * Error monitoring and reporting system
 * Captures, categorizes, and reports errors with context
 */

import React from 'react';
import { clientLogger } from '../client-logger';

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  RATE_LIMIT = 'rate-limit',
  BROWSER = 'browser',
  RUNTIME = 'runtime',
  CHUNK_LOAD = 'chunk-load',
  THIRD_PARTY = 'third-party',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context
interface ErrorContext {
  userId?: string;
  sessionId?: string;
  feature?: string;
  action?: string;
  component?: string;
  url?: string;
  userAgent?: string;
  timestamp?: number;
  [key: string]: unknown;
}

// Enhanced error information
interface EnhancedError {
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  fingerprint: string;
  groupingKey: string;
}

class ErrorMonitor {
  private errorCounts: Map<string, number> = new Map();
  private errorThreshold = 5; // Max errors of same type in 1 minute
  private errorWindow = 60000; // 1 minute window
  private lastErrorTimes: Map<string, number[]> = new Map();
  private ignoredErrors: Set<string> = new Set([
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
  ]);

  // Initialize error monitoring
  init(): void {
    // Global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  // Handle global errors
  private handleError(event: ErrorEvent): void {
    const { message, filename, lineno, colno, error } = event;
    
    // Check if error should be ignored
    if (this.shouldIgnoreError(message)) {
      return;
    }

    const enhancedError = this.enhanceError(error || new Error(message), {
      filename,
      lineno,
      colno,
      type: 'global-error',
    });

    this.reportError(enhancedError);
  }

  // Handle unhandled promise rejections
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    
    const enhancedError = this.enhanceError(error, {
      type: 'unhandled-rejection',
      promise: true,
    });

    this.reportError(enhancedError);
  }

  // Categorize error based on type and message
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('xhr') ||
      message.includes('cors') ||
      error.name === 'NetworkError'
    ) {
      return ErrorCategory.NETWORK;
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required')
    ) {
      return ErrorCategory.VALIDATION;
    }

    // Permission errors
    if (
      message.includes('permission') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return ErrorCategory.PERMISSION;
    }

    // Rate limit errors
    if (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    ) {
      return ErrorCategory.RATE_LIMIT;
    }

    // Chunk load errors (Next.js specific)
    if (
      message.includes('loading chunk') ||
      message.includes('failed to load') ||
      message.includes('dynamically imported module')
    ) {
      return ErrorCategory.CHUNK_LOAD;
    }

    // Third-party errors
    if (this.isThirdPartyError(error)) {
      return ErrorCategory.THIRD_PARTY;
    }

    // Browser-specific errors
    if (
      error.name === 'SecurityError' ||
      error.name === 'QuotaExceededError' ||
      message.includes('localstorage')
    ) {
      return ErrorCategory.BROWSER;
    }

    // Runtime errors
    if (
      error.name === 'TypeError' ||
      error.name === 'ReferenceError' ||
      error.name === 'SyntaxError'
    ) {
      return ErrorCategory.RUNTIME;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Determine error severity
  private determineErrorSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (
      category === ErrorCategory.CHUNK_LOAD ||
      error.message.includes('payment') ||
      error.message.includes('subscription') ||
      error.message.includes('auth')
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity
    if (
      category === ErrorCategory.PERMISSION ||
      category === ErrorCategory.NETWORK ||
      error.name === 'SecurityError'
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (
      category === ErrorCategory.VALIDATION ||
      category === ErrorCategory.RUNTIME
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity
    return ErrorSeverity.LOW;
  }

  // Check if error is from third-party script
  private isThirdPartyError(error: Error): boolean {
    const stack = error.stack || '';
    const thirdPartyDomains = [
      'google-analytics',
      'googletagmanager',
      'facebook',
      'twitter',
      'stripe',
      'sentry',
    ];

    return thirdPartyDomains.some(domain => stack.includes(domain));
  }

  // Check if error should be ignored
  private shouldIgnoreError(message: string): boolean {
    return this.ignoredErrors.has(message) || this.isRateLimited(message);
  }

  // Check if error is rate limited
  private isRateLimited(errorKey: string): boolean {
    const now = Date.now();
    const times = this.lastErrorTimes.get(errorKey) || [];
    
    // Remove old timestamps
    const recentTimes = times.filter(time => now - time < this.errorWindow);
    
    if (recentTimes.length >= this.errorThreshold) {
      return true;
    }

    // Update times
    recentTimes.push(now);
    this.lastErrorTimes.set(errorKey, recentTimes);
    
    return false;
  }

  // Generate error fingerprint for grouping
  private generateFingerprint(error: Error): string {
    const message = error.message.replace(/[0-9]/g, 'X'); // Replace numbers
    const stack = error.stack?.split('\n')[1] || ''; // First stack line
    return `${error.name}-${message}-${stack}`.replace(/\s/g, '-');
  }

  // Generate grouping key for error aggregation
  private generateGroupingKey(error: Error, category: ErrorCategory): string {
    return `${category}-${error.name}-${error.message.substring(0, 50)}`;
  }

  // Enhance error with additional context
  private enhanceError(error: Error, additionalContext: Record<string, unknown> = {}): EnhancedError {
    const category = this.categorizeError(error);
    const severity = this.determineErrorSeverity(error, category);
    
    return {
      message: error.message,
      stack: error.stack,
      category,
      severity,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        ...additionalContext,
      },
      fingerprint: this.generateFingerprint(error),
      groupingKey: this.generateGroupingKey(error, category),
    };
  }

  // Report error
  public reportError(enhancedError: EnhancedError): void {
    // Update error count
    const count = (this.errorCounts.get(enhancedError.groupingKey) || 0) + 1;
    this.errorCounts.set(enhancedError.groupingKey, count);

    // Log based on severity
    const logMethod = enhancedError.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
    
    clientLogger[logMethod](`Error: ${enhancedError.category}`, {
      error: {
        message: enhancedError.message,
        stack: enhancedError.stack,
        category: enhancedError.category,
        severity: enhancedError.severity,
        fingerprint: enhancedError.fingerprint,
        count,
        context: enhancedError.context,
      },
    });

    // Send to error reporting service
    this.sendToErrorService(enhancedError);
  }

  // Send error to reporting service
  private async sendToErrorService(error: EnhancedError): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...error,
          count: this.errorCounts.get(error.groupingKey) || 1,
        }),
      });
    } catch (err) {
      // Fallback to console if reporting fails
      console.error('Failed to report error:', err);
    }
  }

  // Capture error manually
  public captureError(
    error: Error,
    context?: ErrorContext,
    category?: ErrorCategory,
    severity?: ErrorSeverity
  ): void {
    const enhancedError = this.enhanceError(error, context);
    
    // Override category and severity if provided
    if (category) enhancedError.category = category;
    if (severity) enhancedError.severity = severity;
    
    this.reportError(enhancedError);
  }

  // Capture message
  public captureMessage(
    message: string,
    context?: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.LOW
  ): void {
    const error = new Error(message);
    this.captureError(error, context, ErrorCategory.UNKNOWN, severity);
  }

  // Get error statistics
  public getErrorStats(): Record<string, any> {
    const stats: Record<string, any> = {
      total: 0,
      byCategory: {},
      bySeverity: {},
      topErrors: [],
    };

    this.errorCounts.forEach((count, key) => {
      stats.total += count;
      stats.topErrors.push({ key, count });
    });

    stats.topErrors.sort((a: { key: string; count: number }, b: { key: string; count: number }) => b.count - a.count);
    stats.topErrors = stats.topErrors.slice(0, 10);

    return stats;
  }

  // Clear error statistics
  public clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrorTimes.clear();
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitor();

// Export for custom usage
export { ErrorMonitor, type EnhancedError, type ErrorContext };

// React Error Boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorMonitor.captureError(error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
      digest: errorInfo.digest,
    });
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">An error occurred while rendering this component.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}