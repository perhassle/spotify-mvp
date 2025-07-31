import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import crypto from 'crypto';

/**
 * API Security utilities for enhanced protection
 */

// API Key management
const API_KEY_HEADER = 'x-api-key';
const API_SIGNATURE_HEADER = 'x-api-signature';
const API_TIMESTAMP_HEADER = 'x-api-timestamp';

/**
 * Validate API key for service-to-service authentication
 */
export async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get(API_KEY_HEADER);
  
  if (!apiKey) {
    return false;
  }
  
  // In production, validate against stored API keys
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  return validApiKeys.includes(apiKey);
}

/**
 * Generate HMAC signature for request
 */
export function generateRequestSignature(
  method: string,
  path: string,
  timestamp: string,
  body: string,
  secret: string
): string {
  const message = `${method.toUpperCase()}:${path}:${timestamp}:${body}`;
  
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

/**
 * Validate request signature
 */
export async function validateRequestSignature(request: NextRequest): Promise<boolean> {
  const signature = request.headers.get(API_SIGNATURE_HEADER);
  const timestamp = request.headers.get(API_TIMESTAMP_HEADER);
  
  if (!signature || !timestamp) {
    return false;
  }
  
  // Check timestamp is within 5 minutes
  const requestTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - requestTime);
  
  if (timeDiff > 5 * 60 * 1000) {
    return false; // Request too old or too far in future
  }
  
  // Get request body
  const body = await request.clone().text();
  
  // Get API secret (in production, use per-client secrets)
  const apiSecret = process.env.API_SECRET;
  if (!apiSecret) {
    return false;
  }
  
  // Generate expected signature
  const expectedSignature = generateRequestSignature(
    request.method,
    request.nextUrl.pathname,
    timestamp,
    body,
    apiSecret
  );
  
  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Content type validation
 */
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): boolean {
  const contentType = request.headers.get('content-type');
  
  if (!contentType) {
    return false;
  }
  
  return allowedTypes.some(type => contentType.includes(type));
}

/**
 * Request size limiter
 */
export async function checkRequestSize(
  request: NextRequest,
  maxSizeBytes: number
): Promise<boolean> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSizeBytes;
  }
  
  // If no content-length header, read body to check size
  try {
    const body = await request.clone().text();
    return Buffer.byteLength(body, 'utf8') <= maxSizeBytes;
  } catch {
    return false;
  }
}

/**
 * API endpoint access control
 */
export interface EndpointAccess {
  requiresAuth: boolean;
  requiredRoles?: string[];
  requiredScopes?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

const ENDPOINT_ACCESS: Record<string, EndpointAccess> = {
  '/api/admin': {
    requiresAuth: true,
    requiredRoles: ['admin'],
    rateLimit: { requests: 100, windowMs: 60000 },
  },
  '/api/subscription/webhook': {
    requiresAuth: false, // Webhook from Stripe
    rateLimit: { requests: 100, windowMs: 60000 },
  },
  '/api/user': {
    requiresAuth: true,
    rateLimit: { requests: 1000, windowMs: 60000 },
  },
};

/**
 * Check endpoint access permissions
 */
export async function checkEndpointAccess(
  request: NextRequest,
  endpoint: string
): Promise<{ allowed: boolean; reason?: string }> {
  const access = ENDPOINT_ACCESS[endpoint];
  
  if (!access) {
    // No specific access control defined
    return { allowed: true };
  }
  
  // Check authentication
  if (access.requiresAuth) {
    const session = await auth();
    
    if (!session) {
      return { allowed: false, reason: 'Authentication required' };
    }
    
    // Check roles
    if (access.requiredRoles && access.requiredRoles.length > 0) {
      const userRoles = session.user.roles || [];
      const hasRequiredRole = access.requiredRoles.some(role => 
        userRoles.includes(role)
      );
      
      if (!hasRequiredRole) {
        return { allowed: false, reason: 'Insufficient permissions' };
      }
    }
  }
  
  return { allowed: true };
}

/**
 * SQL injection prevention for raw queries
 */
export function preventSqlInjection(input: string): string {
  // Remove or escape dangerous SQL characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, ''); // Remove SQL keywords
}

/**
 * NoSQL injection prevention
 */
export function preventNoSqlInjection(query: any): any {
  if (typeof query === 'string') {
    return query;
  }
  
  if (Array.isArray(query)) {
    return query.map(item => preventNoSqlInjection(item));
  }
  
  if (query && typeof query === 'object') {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(query)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      
      // Prevent MongoDB operators in user input
      if (key.startsWith('$')) {
        continue;
      }
      
      sanitized[key] = preventNoSqlInjection(value);
    }
    
    return sanitized;
  }
  
  return query;
}

/**
 * Path traversal prevention
 */
export function preventPathTraversal(path: string): string {
  // Remove directory traversal patterns
  return path
    .replace(/\.\./g, '')
    .replace(/\.\.%2F/gi, '')
    .replace(/\.\.%5C/gi, '')
    .replace(/%2e%2e/gi, '')
    .replace(/[\/\\]{2,}/g, '/') // Replace multiple slashes
    .replace(/^[\/\\]+/, ''); // Remove leading slashes
}

/**
 * Command injection prevention
 */
export function preventCommandInjection(input: string): string {
  // Remove dangerous shell characters
  const dangerousChars = /[;&|`$(){}[\]<>\\]/g;
  return input.replace(dangerousChars, '');
}

/**
 * XML injection prevention
 */
export function preventXmlInjection(xml: string): string {
  // Basic XML entity encoding
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * LDAP injection prevention
 */
export function preventLdapInjection(input: string): string {
  // Escape LDAP special characters
  const ldapChars: Record<string, string> = {
    '\\': '\\5c',
    '*': '\\2a',
    '(': '\\28',
    ')': '\\29',
    '\0': '\\00',
    '/': '\\2f',
  };
  
  return input.replace(/[\\*()\0/]/g, char => ldapChars[char] || char);
}

/**
 * Comprehensive input validation wrapper
 */
export async function validateApiInput<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    let input;
    
    // Parse request body based on content type
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      input = await request.json();
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      input = Object.fromEntries(formData.entries());
    } else {
      return { success: false, error: 'Unsupported content type' };
    }
    
    // Validate against schema
    const result = schema.safeParse(input);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map(e => e.message).join(', '),
      };
    }
    
    return { success: true, data: result.data };
  } catch (_error) {
    return { success: false, error: 'Invalid request body' };
  }
}

/**
 * API response sanitization
 */
export function sanitizeApiResponse(data: any): any {
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'passwordHash',
    'salt',
    'secret',
    'token',
    'apiKey',
    'privateKey',
    'creditCard',
    'ssn',
    'sessionId',
  ];
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }
    
    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeApiResponse(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}