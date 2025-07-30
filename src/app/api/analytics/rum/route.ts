/**
 * API endpoint for Real User Monitoring (RUM) data collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { validateBudget } from '@/lib/monitoring/performance-budgets';

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
function analyzeMetrics(metrics: any[]): {
  keyMetrics: any[];
  performanceIssues: any[];
  summary: Record<string, any>;
} {
  const keyMetrics: any[] = [];
  const performanceIssues: any[] = [];
  const summary: Record<string, any> = {};

  // Group metrics by type
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.type]) acc[metric.type] = [];
    acc[metric.type].push(metric);
    return acc;
  }, {} as Record<string, any[]>);

  // Analyze page load metrics
  const pageLoadMetrics = metricsByType['page-load'] || [];
  pageLoadMetrics.forEach((metric: any) => {
    const loadTime = metric.data.loadCompleteTime;
    
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
      firstPaint: metric.data.firstPaint,
      domReady: metric.data.domContentLoadedTime,
    });
  });

  // Analyze resource metrics
  const resourceMetrics = metricsByType['resources'] || [];
  resourceMetrics.forEach((metric: any) => {
    const summary = metric.data.summary;
    
    // Check for heavy JavaScript
    if (summary.script && summary.script.totalSize > 500 * 1024) { // 500KB
      performanceIssues.push({
        type: 'heavy-javascript',
        size: summary.script.totalSize,
        count: summary.script.count,
      });
    }

    // Check for too many requests
    const totalRequests = Object.values(summary).reduce((sum: number, type: any) => 
      sum + (type.count || 0), 0);
    
    if (totalRequests > 100) {
      performanceIssues.push({
        type: 'too-many-requests',
        count: totalRequests,
        breakdown: summary,
      });
    }
  });

  // Analyze errors
  const errorMetrics = metricsByType['error'] || [];
  if (errorMetrics.length > 0) {
    summary.errors = {
      count: errorMetrics.length,
      types: errorMetrics.map((e: any) => e.data.message),
    };

    if (errorMetrics.length > 5) {
      performanceIssues.push({
        type: 'high-error-rate',
        count: errorMetrics.length,
        errors: errorMetrics.slice(0, 5),
      });
    }
  }

  // Analyze custom metrics
  const customMetrics = metricsByType['custom'] || [];
  customMetrics.forEach((metric: any) => {
    if (metric.data.name === 'long-task' && metric.data.value > 100) {
      performanceIssues.push({
        type: 'long-task',
        duration: metric.data.value,
        timestamp: metric.timestamp,
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
    summary,
  };
}