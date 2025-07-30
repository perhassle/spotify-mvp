/**
 * Production Error Monitor
 * Simple error monitoring that sends errors to our API endpoint
 * Can be replaced with Sentry later
 */

import { clientLogger } from '../client-logger';

interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

class ProductionErrorMonitor {
  private static instance: ProductionErrorMonitor;
  private errorQueue: ErrorReport[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.setupGlobalErrorHandlers();
    this.startPeriodicFlush();
  }
  
  static getInstance(): ProductionErrorMonitor {
    if (!ProductionErrorMonitor.instance) {
      ProductionErrorMonitor.instance = new ProductionErrorMonitor();
    }
    return ProductionErrorMonitor.instance;
  }
  
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;
    
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'unhandled-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          type: 'unhandled-rejection',
          reason: event.reason,
        }
      );
    });
  }
  
  captureError(error: Error, context?: Record<string, unknown>): void {
    const errorReport: ErrorReport = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: this.determineSeverity(error),
      context,
    };
    
    // Log locally
    clientLogger.error('Error captured', errorReport);
    
    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Flush if queue is getting large
    if (this.errorQueue.length >= 10) {
      this.flush();
    }
  }
  
  private determineSeverity(error: Error): ErrorReport['severity'] {
    // Critical: Authentication, Payment, or Security errors
    if (error.message.toLowerCase().includes('auth') ||
        error.message.toLowerCase().includes('payment') ||
        error.message.toLowerCase().includes('security')) {
      return 'critical';
    }
    
    // High: Network or API errors
    if (error.name === 'NetworkError' || 
        error.message.includes('fetch') ||
        error.message.includes('API')) {
      return 'high';
    }
    
    // Medium: General runtime errors
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'medium';
    }
    
    // Low: Everything else
    return 'low';
  }
  
  private startPeriodicFlush(): void {
    // Flush every 30 seconds
    this.flushTimer = setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flush();
      }
    }, 30000);
    
    // Also flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }
  
  private async flush(): Promise<void> {
    if (this.errorQueue.length === 0) return;
    
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
        keepalive: true,
      });
    } catch (error) {
      // Re-add errors to queue for retry
      this.errorQueue.unshift(...errors);
      clientLogger.error('Failed to send error reports', error);
    }
  }
  
  // Public API
  setUser(user: { id: string; email?: string }): void {
    // Store user context for future errors
    if (typeof window !== 'undefined') {
      window.__errorMonitorUser = user;
    }
  }
  
  clearUser(): void {
    if (typeof window !== 'undefined') {
      delete window.__errorMonitorUser;
    }
  }
}

// Extend window type
declare global {
  interface Window {
    __errorMonitorUser?: { id: string; email?: string };
  }
}

// Export singleton instance
export const errorMonitor = ProductionErrorMonitor.getInstance();