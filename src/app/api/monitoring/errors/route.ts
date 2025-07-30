/**
 * API endpoint for receiving error reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      stack,
      category,
      severity,
      fingerprint,
      count,
      context,
    } = body;

    // Log error server-side with full context
    const logData = {
      error: {
        message,
        stack,
        category,
        severity,
        fingerprint,
        count,
        context: {
          ...context,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          reportedAt: Date.now(),
        },
      },
    };

    // Use appropriate log level based on severity
    switch (severity) {
      case 'critical':
        logger.fatal('Client error reported', logData);
        break;
      case 'high':
        logger.error('Client error reported', logData);
        break;
      case 'medium':
        logger.warn('Client error reported', logData);
        break;
      default:
        logger.info('Client error reported', logData);
    }

    // Here you would typically:
    // 1. Store error in database for analysis
    // 2. Send to error tracking service (Sentry, Bugsnag, etc.)
    // 3. Trigger alerts for critical errors
    // 4. Update error statistics

    // Check if error rate is high
    if (count > 10) {
      logger.warn('High error rate detected', {
        fingerprint,
        count,
        message,
      });
    }

    return NextResponse.json({
      success: true,
      fingerprint,
      reported: true,
    });
  } catch (error) {
    logger.error('Failed to process error report', error);
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}