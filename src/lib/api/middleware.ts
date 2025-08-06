import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { serverError, getRequestPath } from './error-responses';

export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const response = await handler(req);
      
      // Add request ID to all responses if not already present
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (!response.headers.get('X-Request-ID')) {
        response.headers.set('X-Request-ID', requestId);
      }
      
      return response;
    } catch (error) {
      console.error('Unhandled API error:', error);
      
      // Check if it's already a NextResponse (thrown error response)
      if (error instanceof NextResponse || (error && typeof error === 'object' && 'headers' in error)) {
        return error as NextResponse;
      }
      
      // Generic error response
      const path = getRequestPath(req);
      const isDev = process.env.NODE_ENV === 'development';
      
      return serverError(
        'An unexpected error occurred',
        isDev ? { 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        } : undefined,
        path
      );
    }
  };
}

// Enhanced error handler that also logs errors to our tracking system
export function withErrorHandlerAndLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withErrorHandler(async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      // Log error to our tracking system
      if (typeof error === 'object' && error !== null) {
        console.error('API Error Details:', {
          path: getRequestPath(req),
          method: req.method,
          url: req.url,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : error,
          headers: Object.fromEntries(req.headers.entries()),
        });
      }
      
      // Re-throw to be handled by withErrorHandler
      throw error;
    }
  });
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  limit: number = 100, // requests per window
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req: NextRequest) => string = (req) => {
    // Default: use IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip');
    return ip || 'unknown';
  }
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const key = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean up old entries
      for (const [k, data] of requestCounts.entries()) {
        if (data.resetTime < windowStart) {
          requestCounts.delete(k);
        }
      }
      
      // Get or create entry for this key
      const entry = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };
      
      // Check if limit exceeded
      if (entry.count >= limit && entry.resetTime > now) {
        const path = getRequestPath(req);
        const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
        
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Rate limit exceeded',
              details: {
                limit,
                retryAfter: resetInSeconds,
              },
              timestamp: new Date().toISOString(),
              path,
              requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            },
            success: false,
          },
          { 
            status: 429,
            headers: {
              'X-Rate-Limit-Limit': limit.toString(),
              'X-Rate-Limit-Remaining': '0',
              'X-Rate-Limit-Reset': entry.resetTime.toString(),
              'Retry-After': resetInSeconds.toString(),
            }
          }
        );
      }
      
      // Update count
      entry.count++;
      requestCounts.set(key, entry);
      
      // Execute handler
      const response = await handler(req);
      
      // Add rate limit headers to response
      const remaining = Math.max(0, limit - entry.count);
      response.headers.set('X-Rate-Limit-Limit', limit.toString());
      response.headers.set('X-Rate-Limit-Remaining', remaining.toString());
      response.headers.set('X-Rate-Limit-Reset', entry.resetTime.toString());
      
      return response;
    };
  };
}

// Compose multiple middleware functions
export function composeMiddleware(
  ...middlewares: Array<(handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>>
) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// Common middleware combinations
export const withStandardMiddleware = composeMiddleware(
  withErrorHandlerAndLogging,
  withRateLimit(100, 15 * 60 * 1000) // 100 requests per 15 minutes
);

export const withAuthMiddleware = composeMiddleware(
  withErrorHandlerAndLogging,
  withRateLimit(200, 15 * 60 * 1000) // Higher limit for authenticated endpoints
);