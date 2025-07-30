import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar for distributed rate limiting
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
}

// Different rate limits for different endpoints
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth/register': { windowMs: 15 * 60 * 1000, max: 3 },      // 3 per 15 min
  '/api/auth/login': { windowMs: 15 * 60 * 1000, max: 5 },         // 5 per 15 min
  '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  '/api': { windowMs: 60 * 1000, max: 100 },                       // 100 per minute (default)
};

export function withRateLimiter(request: NextRequest) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  
  // Find matching rate limit config
  let config: RateLimitConfig | undefined;
  for (const [path, pathConfig] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pathname.startsWith(path)) {
      config = pathConfig;
      break;
    }
  }

  // Skip if no config found
  if (!config) {
    return NextResponse.next();
  }

  // Get client identifier (IP address or user ID)
  const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
  const key = `${clientId}:${pathname}`;
  const now = Date.now();

  // Get or create rate limit entry
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  const rateLimit = rateLimitStore[key];
  rateLimit.count++;

  // Check if rate limit exceeded
  if (rateLimit.count > config.max) {
    const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000);
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', config.max.toString());
  response.headers.set('X-RateLimit-Remaining', (config.max - rateLimit.count).toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

  return response;
}