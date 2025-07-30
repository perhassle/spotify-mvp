/**
 * API endpoint for receiving Web Vitals metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { WebVital } from '@/types/common';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, metrics, timestamp } = body;

    // Log Web Vitals metrics server-side
    logger.info('Web Vitals received', {
      webVitals: {
        sessionId,
        metrics,
        timestamp,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    });

    // Process metrics for analysis
    const processedMetrics = metrics.map((metric: WebVital) => ({
      ...metric,
      processed: true,
      receivedAt: Date.now(),
    }));

    // Here you would typically:
    // 1. Store metrics in a database or time-series database
    // 2. Send to analytics service (e.g., Google Analytics, Mixpanel)
    // 3. Aggregate for dashboards
    // 4. Alert on poor performance

    // Check for poor performance and log warnings
    metrics.forEach((metric: WebVital) => {
      if (metric.rating === 'poor') {
        logger.warn(`Poor Web Vital detected: ${metric.name}`, {
          metric,
          sessionId,
        });
      }
    });

    return NextResponse.json({
      success: true,
      received: metrics.length,
      sessionId,
    });
  } catch (error) {
    logger.error('Failed to process Web Vitals', error as Error);
    
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}