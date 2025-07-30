/**
 * Real User Monitoring (RUM) implementation
 * Collects and reports real-world performance data from users
 */

import { clientLogger } from '../client-logger';
import { webVitalsMonitor } from './web-vitals';
import { validateBudget, calculatePerformanceScore } from './performance-budgets';

// Network Information API interface
interface NetworkInformation {
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
  addEventListener?: (type: string, listener: EventListener) => void;
}

// RUM metric data
interface RUMMetric {
  type: string;
  timestamp: number;
  sessionId: string;
  data: Record<string, unknown>;
}

// RUM session data
interface RUMSession {
  sessionId: string;
  startTime: number;
  userId?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType?: string;
  pageViews: number;
  interactions: number;
  errors: number;
  metrics: Record<string, unknown>;
}

// RUM configuration
interface RUMConfig {
  sampleRate: number; // 0-1, percentage of users to monitor
  endpoint: string;
  batchSize: number;
  flushInterval: number; // ms
  enableDetailedMetrics: boolean;
}

class RealUserMonitoring {
  private config: RUMConfig;
  private session: RUMSession;
  private metricsQueue: RUMMetric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<RUMConfig> = {}) {
    this.config = {
      sampleRate: 1,
      endpoint: '/api/analytics/rum',
      batchSize: 20,
      flushInterval: 30000, // 30 seconds
      enableDetailedMetrics: true,
      ...config,
    };

    this.session = this.createSession();
  }

  // Initialize RUM
  init(): void {
    // Check if user should be sampled
    if (Math.random() > this.config.sampleRate) {
      clientLogger.info('RUM: User not sampled');
      return;
    }

    // Initialize web vitals with custom handler
    webVitalsMonitor.init();

    // Track page visibility
    this.trackPageVisibility();

    // Track user interactions
    this.trackUserInteractions();

    // Track navigation
    this.trackNavigation();

    // Track resource timing
    this.trackResourceTiming();

    // Track connection changes
    this.trackConnectionChanges();

    // Start periodic flush
    this.startPeriodicFlush();

    clientLogger.info('RUM initialized', {
      sessionId: this.session.sessionId,
      sampleRate: this.config.sampleRate,
    });
  }

  // Create new session
  private createSession(): RUMSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      metrics: {},
    };
  }

  // Track page visibility changes
  private trackPageVisibility(): void {
    let hiddenTime = 0;
    let lastHiddenStart = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        lastHiddenStart = Date.now();
      } else if (lastHiddenStart > 0) {
        hiddenTime += Date.now() - lastHiddenStart;
        this.recordMetric('visibility', {
          totalHiddenTime: hiddenTime,
          lastHiddenDuration: Date.now() - lastHiddenStart,
        });
      }
    });
  }

  // Track user interactions
  private trackUserInteractions(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const selector = this.getElementSelector(target);
      
      this.session.interactions++;
      this.recordMetric('interaction', {
        type: 'click',
        target: selector,
        timestamp: Date.now(),
      });
    }, { capture: true });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.recordMetric('interaction', {
        type: 'form-submit',
        formId: form.id || 'unknown',
        timestamp: Date.now(),
      });
    }, { capture: true });
  }

  // Track navigation
  private trackNavigation(): void {
    // Track initial page load
    this.trackPageLoad();

    // Track route changes (for SPAs)
    if (window.history && window.history.pushState) {
      const originalPushState = window.history.pushState;
      window.history.pushState = function(...args) {
        originalPushState.apply(window.history, args);
        window.dispatchEvent(new Event('pushstate'));
      };

      window.addEventListener('pushstate', () => {
        this.trackPageView();
      });

      window.addEventListener('popstate', () => {
        this.trackPageView();
      });
    }
  }

  // Track page load performance
  private trackPageLoad(): void {
    if (!window.performance || !window.performance.timing) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;

        const pageLoadMetrics = {
          // Navigation timing
          redirectTime: timing.redirectEnd - timing.redirectStart,
          dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
          tcpTime: timing.connectEnd - timing.connectStart,
          requestTime: timing.responseStart - timing.requestStart,
          responseTime: timing.responseEnd - timing.responseStart,
          domProcessingTime: timing.domComplete - timing.domLoading,
          domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadCompleteTime: timing.loadEventEnd - timing.navigationStart,
          
          // Additional metrics
          firstPaint: this.getFirstPaint(),
          redirectCount: navigation.redirectCount,
          navigationType: this.getNavigationType(navigation.type),
        };

        // Validate against budgets
        const budgetValidation = validateBudget('loadCompleteTime', pageLoadMetrics.loadCompleteTime);
        if (!budgetValidation.passed) {
          clientLogger.warn('Page load budget exceeded', {
            violations: budgetValidation.violations,
          });
        }

        this.recordMetric('page-load', pageLoadMetrics);
        this.session.pageViews++;
      }, 0);
    });
  }

  // Track page views (SPA navigation)
  public trackPageView(url?: string): void {
    const viewMetrics = {
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
      viewIndex: ++this.session.pageViews,
    };

    this.recordMetric('page-view', viewMetrics);
  }

  // Track resource timing
  private trackResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      const resourceMetrics = entries.map(entry => {
        const perfEntry = entry as PerformanceResourceTiming;
        return {
          name: entry.name,
          type: perfEntry.initiatorType || 'unknown',
          duration: Math.round(entry.duration),
          size: perfEntry.transferSize || 0,
          cached: perfEntry.transferSize === 0,
        };
      });

      // Group by type
      const byType = resourceMetrics.reduce((acc, resource) => {
        if (!acc[resource.type]) {
          acc[resource.type] = {
            count: 0,
            totalDuration: 0,
            totalSize: 0,
          };
        }
        acc[resource.type].count++;
        acc[resource.type].totalDuration += resource.duration;
        acc[resource.type].totalSize += resource.size;
        return acc;
      }, {} as Record<string, any>);

      if (this.config.enableDetailedMetrics) {
        this.recordMetric('resources', {
          summary: byType,
          details: resourceMetrics.slice(0, 10), // Top 10 resources
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      clientLogger.debug('Resource timing not supported');
    }
  }

  // Track connection changes
  private trackConnectionChanges(): void {
    const nav = navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (!connection) return;

    const trackConnection = () => {
      this.session.connectionType = connection.effectiveType;
      this.recordMetric('connection-change', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: (connection as any).saveData,
      });
    };

    connection.addEventListener?.('change', trackConnection);
    trackConnection(); // Initial tracking
  }

  // Record metric
  private recordMetric(type: string, data: Record<string, unknown>): void {
    const metric = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.session.sessionId,
      url: window.location.href,
    };

    this.metricsQueue.push(metric);

    // Flush if batch size reached
    if (this.metricsQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Start periodic flush
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.metricsQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  // Flush metrics to server
  private async flush(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const metricsToSend = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      // Calculate session performance score
      const performanceScore = calculatePerformanceScore(this.session.metrics as Record<string, number>);

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: {
            ...this.session,
            duration: Date.now() - this.session.startTime,
            performanceScore,
          },
          metrics: metricsToSend,
        }),
        keepalive: true,
      });

      clientLogger.debug('RUM metrics flushed', {
        count: metricsToSend.length,
      });
    } catch (error) {
      clientLogger.error('Failed to flush RUM metrics', error);
      // Re-add metrics to queue for retry
      this.metricsQueue.unshift(...metricsToSend);
    }
  }

  // Helper methods
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string | undefined {
    const nav = navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    return connection?.effectiveType;
  }

  private getFirstPaint(): number {
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? Math.round(firstPaint.startTime) : 0;
    }
    return 0;
  }

  private getNavigationType(type: number): string {
    switch (type) {
      case 0: return 'navigate';
      case 1: return 'reload';
      case 2: return 'back_forward';
      default: return 'unknown';
    }
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Public API
  public trackCustomMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    this.recordMetric('custom', {
      name,
      value,
      ...metadata,
    });
  }

  public trackError(error: Error, context?: Record<string, unknown>): void {
    this.session.errors++;
    this.recordMetric('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  public setUser(userId: string, userData?: Record<string, unknown>): void {
    this.session.userId = userId;
    this.recordMetric('user-identified', {
      userId,
      ...userData,
    });
  }

  public getSession(): RUMSession {
    return { ...this.session };
  }
}

// Create singleton instance only in browser
let rumInstance: RealUserMonitoring | null = null;

export const rum = {
  init() {
    if (typeof window !== 'undefined' && !rumInstance) {
      rumInstance = new RealUserMonitoring();
      rumInstance.init();
    }
  },
  
  trackPageView(url?: string) {
    if (rumInstance) {
      rumInstance.trackPageView(url);
    }
  },
  
  trackError(error: Error, context?: Record<string, unknown>) {
    if (rumInstance) {
      rumInstance.trackError(error, context);
    }
  },
  
  trackCustomMetric(name: string, value: number, metadata?: Record<string, unknown>) {
    if (rumInstance) {
      rumInstance.trackCustomMetric(name, value, metadata);
    }
  },
  
  getSession() {
    if (rumInstance) {
      return rumInstance.getSession();
    }
    return null;
  }
};

// Export for custom usage
export { RealUserMonitoring, type RUMSession, type RUMConfig };