/**
 * API endpoint for Real User Monitoring (RUM) data collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { validateBudget } from '@/lib/monitoring/performance-budgets';

// Define types for RUM data
interface _RUMSession {
  sessionId: string;
  userId?: string;
  duration: number;
  performanceScore: number;
  deviceType: string;
  connectionType: string;
  pageViews: number;
  interactions: number;
  errors: number;
}

interface RUMMetric {
  type: string;
  timestamp: number;
  url?: string;
  data: Record<string, unknown>;
}

interface PageLoadMetric extends RUMMetric {
  type: 'page-load';
  data: {
    loadCompleteTime: number;
    firstPaint: number;
    domContentLoadedTime: number;
  };
}

interface ResourceMetric extends RUMMetric {
  type: 'resources';
  data: {
    summary: Record<string, {
      count: number;
      totalSize: number;
    }>;
  };
}

interface ErrorMetric extends RUMMetric {
  type: 'error';
  data: {
    message: string;
    stack?: string;
  };
}

interface CustomMetric extends RUMMetric {
  type: 'custom';
  data: {
    name: string;
    value: number;
  };
}

type _AnalyzedMetric = PageLoadMetric | ResourceMetric | ErrorMetric | CustomMetric;

interface PerformanceIssue {
  type: string;
  value?: number;
  size?: number;
  count?: number;
  violations?: unknown[];
  url?: string;
  breakdown?: Record<string, unknown>;
  errors?: ErrorMetric[];
  duration?: number;
  timestamp?: number;
}

interface KeyMetric {
  type: string;
  loadTime?: number;
  firstPaint?: number;
  domReady?: number;
}

interface MetricsSummary {
  totalMetrics: number;
  metricTypes: string[];
  pageViews: number;
  interactions: number;
  errors?: {
    count: number;
    types: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, metrics } = body;

    // Log session data
    logger.info('RUM data received', {
      rum: {
        sessionId: session.sessionId,
        userId: session.userId,
        duration: session.duration,
        performanceScore: session.performanceScore,
        deviceType: session.deviceType,
        connectionType: session.connectionType,
        pageViews: session.pageViews,
        interactions: session.interactions,
        errors: session.errors,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    // Process and analyze metrics
    const analysis = analyzeMetrics(metrics);
    
    // Log performance issues
    if (analysis.performanceIssues.length > 0) {
      logger.warn('Performance issues detected', {
        sessionId: session.sessionId,
        issues: analysis.performanceIssues,
      });
    }

    // Log high-value metrics
    analysis.keyMetrics.forEach(metric => {
      logger.info(`RUM metric: ${metric.type}`, {
        sessionId: session.sessionId,
        metric,
      });
    });

    // Here you would typically:
    // 1. Store in a time-series database (InfluxDB, TimescaleDB)
    // 2. Send to analytics service (Google Analytics, Mixpanel)
    // 3. Update dashboards and alerts
    // 4. Trigger alerts for critical issues

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      metricsReceived: metrics.length,
      analysis: {
        performanceScore: session.performanceScore,
        issuesFound: analysis.performanceIssues.length,
      },
    });
  } catch (error) {
    logger.error('Failed to process RUM data', error);
    
    return NextResponse.json(
      { error: 'Failed to process RUM data' },
      { status: 500 }
    );
  }
}

// Analyze metrics for insights and issues
function analyzeMetrics(metrics: RUMMetric[]): {
  keyMetrics: KeyMetric[];
  performanceIssues: PerformanceIssue[];
  summary: MetricsSummary;
} {
  const keyMetrics: KeyMetric[] = [];
  const performanceIssues: PerformanceIssue[] = [];
  const summary: Partial<MetricsSummary> = {};

  // Group metrics by type
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) acc[metric.type] = [];
    acc[metric.type]!.push(metric);
    return acc;
  }, {} as Record<string, RUMMetric[]>);

  // Analyze page load metrics
  const pageLoadMetrics = metricsByType['page-load'] || [];
  pageLoadMetrics.forEach((metric: RUMMetric) => {
    const pageLoadMetric = metric as PageLoadMetric;
    const loadTime = pageLoadMetric.data.loadCompleteTime;
    
    // Check against budgets
    const validation = validateBudget('loadCompleteTime', loadTime);
    if (!validation.passed) {
      performanceIssues.push({
        type: 'slow-page-load',
        value: loadTime,
        violations: validation.violations,
        url: metric.url,
      });
    }

    keyMetrics.push({
      type: 'page-load',
      loadTime,
      firstPaint: pageLoadMetric.data.firstPaint,
      domReady: pageLoadMetric.data.domContentLoadedTime,
    });
  });

  // Analyze resource metrics
  const resourceMetrics = metricsByType['resources'] || [];
  resourceMetrics.forEach((metric: RUMMetric) => {
    const resourceMetric = metric as ResourceMetric;
    const resourceSummary = resourceMetric.data.summary;
    
    // Check for heavy JavaScript
    if (resourceSummary.script && resourceSummary.script.totalSize > 500 * 1024) { // 500KB
      performanceIssues.push({
        type: 'heavy-javascript',
        size: resourceSummary.script.totalSize,
        count: resourceSummary.script.count,
      });
    }

    // Check for too many requests
    const totalRequests = Object.values(resourceSummary).reduce((sum: number, type) => 
      sum + (type.count || 0), 0);
    
    if (totalRequests > 100) {
      performanceIssues.push({
        type: 'too-many-requests',
        count: totalRequests,
        breakdown: resourceSummary,
      });
    }
  });

  // Analyze errors
  const errorMetrics = metricsByType['error'] || [];
  if (errorMetrics.length > 0) {
    summary.errors = {
      count: errorMetrics.length,
      types: errorMetrics.map((e: RUMMetric) => (e as ErrorMetric).data.message),
    };

    if (errorMetrics.length > 5) {
      performanceIssues.push({
        type: 'high-error-rate',
        count: errorMetrics.length,
        errors: errorMetrics.slice(0, 5) as ErrorMetric[],
      });
    }
  }

  // Analyze custom metrics
  const customMetrics = metricsByType['custom'] || [];
  customMetrics.forEach((metric: RUMMetric) => {
    const customMetric = metric as CustomMetric;
    if (customMetric.data.name === 'long-task' && customMetric.data.value > 100) {
      performanceIssues.push({
        type: 'long-task',
        duration: customMetric.data.value,
        timestamp: customMetric.timestamp,
      });
    }
  });

  // Create summary
  summary.totalMetrics = metrics.length;
  summary.metricTypes = Object.keys(metricsByType);
  summary.pageViews = pageLoadMetrics.length;
  summary.interactions = metricsByType['interaction']?.length || 0;

  return {
    keyMetrics,
    performanceIssues,
    summary: summary as MetricsSummary,
  };
}