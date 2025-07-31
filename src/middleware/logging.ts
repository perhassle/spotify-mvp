import { NextRequest, NextResponse } from 'next/server';
import { logger, createLogger } from '@/lib/logger';

// Type for middleware context
interface MiddlewareContext {
  requestId: string;
  startTime: number;
}

// Create a Map to store request contexts
const requestContexts = new Map<string, MiddlewareContext>();

/**
 * Logging middleware for API routes
 * Logs all incoming requests and their responses
 */
export function loggingMiddleware(request: NextRequest) {
  // Generate unique request ID
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Store context for response logging
  requestContexts.set(requestId, { requestId, startTime });
  
  // Create logger with request context
  const requestLogger = createLogger({ requestId });
  
  // Extract request information
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const contentType = request.headers.get('content-type') || 'Unknown';
  const referer = request.headers.get('referer') || 'Direct';
  
  // Log incoming request
  requestLogger.info('Incoming request', {
    method,
    path: pathname,
    query: search,
    headers: {
      'user-agent': userAgent,
      'content-type': contentType,
      referer,
    },
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
  });
  
  // Add request ID to headers for downstream services
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  // Clone request with new headers
  const modifiedRequest = new NextRequest(request, {
    headers: requestHeaders,
  });
  
  return { request: modifiedRequest, requestId, startTime };
}

/**
 * Log response information
 */
export function logResponse(
  requestId: string,
  response: NextResponse,
  error?: Error
) {
  const context = requestContexts.get(requestId);
  if (!context) {
    logger.warn('No request context found for response logging', { requestId });
    return;
  }
  
  const { startTime } = context;
  const duration = Date.now() - startTime;
  const requestLogger = createLogger({ requestId });
  
  // Clean up context
  requestContexts.delete(requestId);
  
  if (error) {
    requestLogger.error('Request failed', error, {
      duration,
      durationUnit: 'ms',
    });
    return;
  }
  
  const statusCode = response.status;
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  requestLogger[logLevel]('Request completed', {
    statusCode,
    duration,
    durationUnit: 'ms',
    headers: {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    },
  });
}

/**
 * Wrap API route handlers with logging
 */
export function withLogging<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const { request: modifiedRequest, requestId, startTime: _startTime } = loggingMiddleware(request);
    
    const requestLogger = createLogger({ requestId });
    
    try {
      // Call the original handler with modified request
      const response = await handler(modifiedRequest, ...args.slice(1));
      
      // Log successful response
      if (response instanceof NextResponse) {
        logResponse(requestId, response);
      }
      
      return response;
    } catch (error) {
      // Log error
      requestLogger.error('Unhandled error in API route', error as Error);
      logResponse(requestId, NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ), error as Error);
      
      // Re-throw to let Next.js handle it
      throw error;
    }
  }) as T;
}

/**
 * Middleware for tracking API performance
 */
export function performanceMiddleware(routeName: string) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest;
      const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
      const requestLogger = createLogger({ requestId, route: routeName });
      
      const endTimer = requestLogger.startTimer(`api.${routeName}`);
      
      try {
        const result = await handler(...args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        throw error;
      }
    }) as T;
  };
}

/**
 * Audit logging middleware for sensitive operations
 */
export function auditMiddleware(
  resource: string,
  action: string
) {
  return function <T extends (...args: any[]) => any>(handler: T): T {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest;
      const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
      const requestLogger = createLogger({ requestId });
      
      // Extract user information from request (adjust based on your auth setup)
      const userId = request.headers.get('x-user-id') || 'anonymous';
      
      try {
        const result = await handler(...args);
        
        // Log successful audit
        requestLogger.audit(action, resource, 'success', {
          userId,
          method: request.method,
          path: request.nextUrl.pathname,
        });
        
        return result;
      } catch (error) {
        // Log failed audit
        requestLogger.audit(action, resource, 'failure', {
          userId,
          method: request.method,
          path: request.nextUrl.pathname,
          error: (error as Error).message,
        });
        
        throw error;
      }
    }) as T;
  };
}