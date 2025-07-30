/**
 * Client-side logger for browser environments
 * Sends logs to the server API and provides fallback to console
 */

import React from 'react';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  userId?: string;
  feature?: string;
  component?: string;
  [key: string]: any;
}

class ClientLogger {
  private context: LogContext;
  private queue: Array<{
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: string;
  }> = [];
  private isOnline = true;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(context: LogContext = {}) {
    this.context = context;
    
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): ClientLogger {
    return new ClientLogger({
      ...this.context,
      ...additionalContext,
    });
  }

  // Core logging methods
  error(message: string, error?: Error | any, data?: any): void {
    this.log('error', message, {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: any): void {
    // Only log debug in development
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  // Feature tracking
  feature(featureName: string, action: string, metadata?: any): void {
    this.info(`Feature: ${featureName}`, {
      feature: {
        name: featureName,
        action,
        ...metadata,
      },
    });
  }

  // Performance tracking
  performance(operation: string, duration: number, metadata?: any): void {
    this.info(`Performance: ${operation}`, {
      performance: {
        operation,
        duration,
        durationUnit: 'ms',
        ...metadata,
      },
    });
  }

  // Timer utility
  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.performance(operation, duration);
    };
  }

  // Error boundary logging
  logErrorBoundary(error: Error, errorInfo: any): void {
    this.error('React Error Boundary', error, {
      componentStack: errorInfo.componentStack,
      digest: errorInfo.digest,
    });
  }

  // Core logging implementation
  private log(level: LogLevel, message: string, data?: any): void {
    const logEntry = {
      level,
      message,
      data: {
        ...this.context,
        ...data,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, data);
    }

    // Add to queue
    this.queue.push(logEntry);

    // Batch logs (send every 1 second or when queue reaches 10 items)
    if (this.queue.length >= 10) {
      this.flushQueue();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushQueue(), 1000);
    }
  }

  // Send logs to server
  private async flushQueue(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.queue.length === 0 || !this.isOnline) {
      return;
    }

    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      // Send logs individually or in batch
      for (const log of logsToSend) {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...log,
            userAgent: navigator.userAgent,
          }),
        });
      }
    } catch (error) {
      // If sending fails, add logs back to queue
      this.queue.unshift(...logsToSend);
      
      // Log to console as fallback
      console.error('Failed to send logs to server:', error);
      logsToSend.forEach(log => {
        console.log(`[${log.level.toUpperCase()}]`, log.message, log.data);
      });
    }
  }
}

// Create singleton instance
export const clientLogger = new ClientLogger();

// Export for creating custom instances
export { ClientLogger };

// React hook for component logging
export function useLogger(componentName: string): ClientLogger {
  return clientLogger.child({ component: componentName });
}

// Higher-order component for error boundary logging
export function withErrorLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return class WithErrorLogging extends React.Component<P> {
    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      clientLogger.child({ component: componentName }).logErrorBoundary(error, errorInfo);
    }

    override render() {
      return React.createElement(Component, this.props);
    }
  };
}