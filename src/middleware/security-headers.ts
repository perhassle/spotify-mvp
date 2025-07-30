import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export function withSecurityHeaders(request: NextRequest) {
  const response = NextResponse.next();
  
  // Generate CSP nonce for inline scripts
  const nonce = randomBytes(16).toString('base64');
  
  // Enhanced Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com wss://localhost:* ws://localhost:*;
    media-src 'self' blob:;
    object-src 'none';
    frame-src https://js.stripe.com https://hooks.stripe.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    worker-src 'self' blob:;
    child-src 'self' blob:;
    manifest-src 'self';
    upgrade-insecure-requests;
    block-all-mixed-content;
  `.replace(/\s+/g, ' ').trim();

  // Apply comprehensive security headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // Additional security headers
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  
  // Set CSP nonce for inline scripts
  response.headers.set('X-Nonce', nonce);
  
  // Expect-CT header for Certificate Transparency
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Expect-CT', 'max-age=86400, enforce');
  }
  
  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  // Remove potentially dangerous headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}