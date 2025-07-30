/**
 * Web Vitals monitoring implementation
 * Tracks Core Web Vitals: LCP, INP, CLS, FCP, TTFB
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { clientLogger } from '../client-logger';

// Network Information API interface
interface NetworkInformation {
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
}

// Web Vitals thresholds (in milliseconds or score)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

// Rating for Web Vitals metrics
type Rating = 'good' | 'needs-improvement' | 'poor';

// Vitals data structure
interface VitalsData {
  name: string;
  value: number;
  rating: Rating;
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

// Configuration options
interface WebVitalsConfig {
  reportToAnalytics?: boolean;
  reportToConsole?: boolean;
  sampleRate?: number; // 0-1, percentage of users to track
  onMetric?: (metric: VitalsData) => void;
}

class WebVitalsMonitor {
  private config: WebVitalsConfig;
  private metricsBuffer: VitalsData[] = [];
  private reportTimer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(config: WebVitalsConfig = {}) {
    this.config = {
      reportToAnalytics: true,
      reportToConsole: process.env.NODE_ENV === 'development',
      sampleRate: 1,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  // Initialize Web Vitals monitoring
  init(): void {
    // Check if user should be sampled
    if (Math.random() > (this.config.sampleRate || 1)) {
      return;
    }

    // Report all available metrics
    onCLS(this.handleMetric.bind(this), { reportAllChanges: false });
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this), { reportAllChanges: false });
    onTTFB(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this), { reportAllChanges: false });

    // Listen for page visibility changes to send metrics
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushMetrics();
        }
      });
    }
  }

  // Handle individual metric
  private handleMetric(metric: Metric): void {
    const rating = this.getRating(metric.name, metric.value);
    
    const vitalsData: VitalsData = {
      name: metric.name,
      value: Math.round(metric.value),
      rating,
      delta: Math.round(metric.delta),
      id: metric.id,
      navigationType: metric.navigationType || 'navigate',
      url: window.location.href,
      timestamp: Date.now(),
    };

    // Log to console in development
    if (this.config.reportToConsole) {
      console.log(`Web Vitals: ${metric.name}`, {
        value: vitalsData.value,
        rating,
        delta: vitalsData.delta,
      });
    }

    // Call custom handler if provided
    if (this.config.onMetric) {
      this.config.onMetric(vitalsData);
    }

    // Add to buffer
    this.metricsBuffer.push(vitalsData);

    // Schedule batch reporting
    this.scheduleBatchReport();

    // Log poor metrics immediately
    if (rating === 'poor') {
      this.logMetric(vitalsData, 'warn');
    }
  }

  // Get rating based on thresholds
  private getRating(metricName: string, value: number): Rating {
    const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  // Schedule batch reporting
  private scheduleBatchReport(): void {
    if (this.reportTimer) return;

    this.reportTimer = setTimeout(() => {
      this.flushMetrics();
    }, 5000); // Report every 5 seconds
  }

  // Flush metrics buffer
  private flushMetrics(): void {
    if (this.reportTimer) {
      clearTimeout(this.reportTimer);
      this.reportTimer = null;
    }

    if (this.metricsBuffer.length === 0) return;

    const metricsToReport = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Group metrics by rating
    const metricsByRating = metricsToReport.reduce((acc, metric) => {
      if (!acc[metric.rating]) acc[metric.rating] = [];
      acc[metric.rating].push(metric);
      return acc;
    }, {} as Record<Rating, VitalsData[]>);

    // Log aggregated metrics
    if (this.config.reportToAnalytics) {
      clientLogger.info('Web Vitals Report', {
        webVitals: {
          sessionId: this.sessionId,
          metrics: metricsToReport,
          summary: {
            good: metricsByRating.good?.length || 0,
            needsImprovement: metricsByRating['needs-improvement']?.length || 0,
            poor: metricsByRating.poor?.length || 0,
          },
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          connection: this.getConnectionInfo(),
        },
      });
    }

    // Send to analytics endpoint
    this.sendToAnalytics(metricsToReport);
  }

  // Log individual metric
  private logMetric(metric: VitalsData, level: 'info' | 'warn' = 'info'): void {
    const logger = level === 'warn' ? clientLogger.warn : clientLogger.info;
    
    logger.call(clientLogger, `Web Vital: ${metric.name}`, {
      webVital: {
        ...metric,
        sessionId: this.sessionId,
        connection: this.getConnectionInfo(),
      },
    });
  }

  // Send metrics to analytics endpoint
  private async sendToAnalytics(metrics: VitalsData[]): Promise<void> {
    if (!this.config.reportToAnalytics) return;

    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          metrics,
          timestamp: Date.now(),
        }),
        keepalive: true, // Ensure request completes even if page unloads
      });
    } catch (error) {
      clientLogger.error('Failed to send Web Vitals', error);
    }
  }

  // Get connection information
  private getConnectionInfo(): { effectiveType?: string; rtt?: number; downlink?: number } | null {
    const nav = navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: (connection as any).saveData,
    } as any;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current metrics summary
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    this.metricsBuffer.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          value: metric.value,
          rating: metric.rating,
          count: 1,
        };
      } else {
        summary[metric.name].count++;
        // Keep the latest value
        summary[metric.name].value = metric.value;
        summary[metric.name].rating = metric.rating;
      }
    });

    return summary;
  }
}

// Create singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Export for custom configurations
export { WebVitalsMonitor, type WebVitalsConfig, type VitalsData };

// Utility function to report custom metrics
export function reportCustomMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
  clientLogger.info(`Custom Metric: ${name}`, {
    customMetric: {
      name,
      value,
      unit: 'ms',
      timestamp: Date.now(),
      ...metadata,
    },
  });
}