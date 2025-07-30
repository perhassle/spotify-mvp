import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withLogging, performanceMiddleware } from '@/middleware/logging';

interface ClientLogEntry {
  level: string;
  message: string;
  data?: any;
  timestamp: string;
  userAgent: string;
  url?: string;
  userId?: string;
}

async function clientLoggingHandler(request: NextRequest) {
  try {
    const body: ClientLogEntry = await request.json();
    const { level, message, data, timestamp, userAgent, url, userId } = body;

    // Get request ID from headers
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    
    // Create logger with client context
    const clientLogger = logger.child({
      requestId,
      source: 'client',
      userAgent,
      url,
      userId,
      clientTimestamp: timestamp
    });

    // Map client log levels to server logger methods
    switch (level.toLowerCase()) {
      case 'error':
        clientLogger.error(`[Client] ${message}`, data?.error || data);
        break;
      case 'warn':
        clientLogger.warn(`[Client] ${message}`, data);
        break;
      case 'info':
        clientLogger.info(`[Client] ${message}`, data);
        break;
      case 'debug':
        clientLogger.debug(`[Client] ${message}`, data);
        break;
      default:
        clientLogger.info(`[Client] ${message}`, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process client log', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to process log' },
      { status: 500 }
    );
  }
}

// Export with logging middleware
export const POST = withLogging(
  performanceMiddleware('logs.client')(clientLoggingHandler)
);