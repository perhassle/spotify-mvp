import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * CSRF Protection utilities
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_FORM_FIELD = 'csrfToken';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token in secure cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

/**
 * Get CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }
  
  // Get token from cookie
  const cookieToken = await getCsrfToken();
  if (!cookieToken) {
    return false;
  }
  
  // Get token from request (header or body)
  let requestToken: string | null = null;
  
  // Check header first
  requestToken = request.headers.get(CSRF_HEADER_NAME);
  
  // If not in header, check body (for forms)
  if (!requestToken && request.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await request.clone().json();
      requestToken = body[CSRF_FORM_FIELD];
    } catch {
      // Body parsing failed
    }
  }
  
  // If not in header or JSON body, check form data
  if (!requestToken && request.headers.get('content-type')?.includes('form-data')) {
    try {
      const formData = await request.clone().formData();
      requestToken = formData.get(CSRF_FORM_FIELD) as string;
    } catch {
      // Form parsing failed
    }
  }
  
  // Validate tokens match
  return requestToken === cookieToken;
}

/**
 * CSRF protection middleware for API routes
 */
export async function csrfProtection(request: NextRequest): Promise<Response | null> {
  // Skip CSRF for public endpoints
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/health',
    '/api/ready',
  ];
  
  if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
    return null;
  }
  
  const isValid = await validateCsrfToken(request);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'CSRF validation failed',
        message: 'Invalid or missing CSRF token',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null;
}

// Client-side functions moved to csrf-client.tsx
