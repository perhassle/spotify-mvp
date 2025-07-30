import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth/config';
import { withSecurityHeaders } from '@/middleware/security-headers';
import { withRateLimiter } from '@/middleware/rate-limiter';
import { loggingMiddleware } from '@/middleware/logging';
import { csrfProtection } from '@/lib/security/csrf';
import { securityMonitoring } from '@/lib/security/monitoring';
import { validateSecureSession } from '@/lib/security/session';
import { checkEndpointAccess } from '@/lib/security/api-security';

const { auth } = NextAuth(authConfig);

// Define protected routes
const protectedRoutes = [
  '/playlist',
  '/library',
  '/liked-songs',
  '/settings',
  '/premium',
  '/subscription/manage',
];

// Define auth routes (should redirect if logged in)
const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Define high-security routes requiring additional validation
const highSecurityRoutes = [
  '/api/subscription',
  '/api/payment',
  '/api/admin',
  '/settings/security',
];

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Apply security monitoring for all routes
  await securityMonitoring(req as NextRequest);

  // Apply logging middleware for all routes
  const { request: loggedRequest } = loggingMiddleware(req as NextRequest);

  // Apply CSRF protection for API routes
  if (nextUrl.pathname.startsWith('/api/')) {
    const csrfResponse = await csrfProtection(req as NextRequest);
    if (csrfResponse) {
      return csrfResponse;
    }
  }

  // Apply rate limiting for API routes
  if (nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = withRateLimiter(loggedRequest);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // Check endpoint access permissions
  if (nextUrl.pathname.startsWith('/api/')) {
    const accessCheck = await checkEndpointAccess(req as NextRequest, nextUrl.pathname);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Access denied' },
        { status: 403 }
      );
    }
  }

  // Validate session security for high-security routes
  const isHighSecurityRoute = highSecurityRoutes.some(route =>
    nextUrl.pathname.startsWith(route)
  );
  
  if (isHighSecurityRoute && isLoggedIn) {
    const sessionValidation = await validateSecureSession(
      req as NextRequest,
      true // Require MFA for high-security routes
    );
    
    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { error: sessionValidation.reason || 'Invalid session' },
        { status: 401 }
      );
    }
    
    if (sessionValidation.requiresReauth) {
      const reauthUrl = new URL('/auth/verify', nextUrl);
      reauthUrl.searchParams.set('from', nextUrl.pathname);
      return NextResponse.redirect(reauthUrl);
    }
  }

  const isProtectedRoute = protectedRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  );

  // Create response
  let response: NextResponse;

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    response = NextResponse.redirect(new URL('/', nextUrl));
  }
  // Redirect unauthenticated users from protected pages
  else if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', nextUrl);
    loginUrl.searchParams.set('from', nextUrl.pathname);
    response = NextResponse.redirect(loginUrl);
  }
  // Continue with the request
  else {
    response = NextResponse.next();
  }

  // Apply security headers
  const securityResponse = withSecurityHeaders(req as NextRequest);
  
  // Merge headers from both responses
  response.headers.forEach((value, key) => {
    securityResponse.headers.set(key, value);
  });
  
  return securityResponse;
});

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};