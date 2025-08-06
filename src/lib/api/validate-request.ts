import { z, ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { badRequest, getRequestPath } from './error-responses';
import { sanitizeSearchQuery } from '../security/sanitization';

export function validateRequest<T>(
  schema: z.ZodSchema<T>
): (body: unknown, request?: Request) => { data: T } | { error: NextResponse } {
  return (body: unknown, request?: Request) => {
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errors = result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      const path = request ? getRequestPath(request) : '';
      
      return {
        error: badRequest('Validation failed', { errors }, path)
      };
    }
    
    return { data: result.data };
  };
}

// Common validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name must be less than 100 characters'),
});

export const playlistCreateSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Playlist name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isPublic: z.boolean().optional().default(false),
  collaborative: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  folderId: z.string().optional(),
  templateId: z.string().optional(),
});

export const searchParamsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters').transform(sanitizeSearchQuery),
  type: z.enum(['all', 'track', 'artist', 'album', 'playlist']).optional().default('all'),
  genre: z.string().max(50, 'Genre must be less than 50 characters').optional(),
  year: z.coerce.number().min(1900, 'Year must be 1900 or later').max(new Date().getFullYear() + 1, 'Year cannot be in the future').optional(),
  explicit: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'popularity', 'release_date', 'alphabetical']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(50, 'Limit cannot exceed 50').optional().default(20),
  offset: z.coerce.number().min(0, 'Offset cannot be negative').max(10000, 'Offset cannot exceed 10000').optional().default(0),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Utility to validate query parameters from URL
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams,
  request?: Request
): { data: T } | { error: NextResponse } {
  const params: Record<string, string | null> = {};
  
  // Convert URLSearchParams to object
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  return validateRequest(schema)(params, request);
}

// Middleware wrapper for validation
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validation = validateRequest(schema)(body, request);
      
      if ('error' in validation) {
        return validation.error;
      }
      
      return await handler(validation.data, request);
    } catch (error) {
      console.error('Request validation error:', error);
      const path = getRequestPath(request);
      return badRequest('Invalid JSON in request body', undefined, path);
    }
  };
}

// Export types
export type ValidationResult<T> = { data: T } | { error: NextResponse };