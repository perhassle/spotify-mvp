import { NextResponse } from 'next/server';

export enum ApiErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
    requestId?: string;
  };
  success: false;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
  path?: string,
  requestId?: string
): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';
  
  const errorResponse: ApiErrorResponse = {
    error: {
      code,
      message,
      details: isDev ? details : undefined,
      timestamp: new Date().toISOString(),
      path: path || '',
      requestId: requestId || generateRequestId(),
    },
    success: false,
  };

  return NextResponse.json(errorResponse, { 
    status,
    headers: {
      'X-Request-ID': errorResponse.error.requestId || generateRequestId(),
    }
  });
}

export function createSuccessResponse<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number }
): NextResponse {
  const successResponse: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta,
  };

  return NextResponse.json(successResponse);
}

// Generate a unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Convenience functions
export const unauthorized = (message = 'Unauthorized', details?: unknown, path?: string) => 
  createErrorResponse(ApiErrorCode.UNAUTHORIZED, message, 401, details, path);

export const badRequest = (message: string, details?: unknown, path?: string) =>
  createErrorResponse(ApiErrorCode.INVALID_REQUEST, message, 400, details, path);

export const notFound = (resource: string, path?: string) =>
  createErrorResponse(ApiErrorCode.NOT_FOUND, `${resource} not found`, 404, undefined, path);

export const serverError = (message = 'Internal server error', details?: unknown, path?: string) =>
  createErrorResponse(ApiErrorCode.INTERNAL_ERROR, message, 500, details, path);

export const conflict = (message: string, details?: unknown, path?: string) =>
  createErrorResponse(ApiErrorCode.CONFLICT, message, 409, details, path);

export const rateLimited = (message = 'Rate limit exceeded', details?: unknown, path?: string) =>
  createErrorResponse(ApiErrorCode.RATE_LIMITED, message, 429, details, path);

export const invalidCredentials = (message = 'Invalid email or password', path?: string) =>
  createErrorResponse(ApiErrorCode.INVALID_CREDENTIALS, message, 401, undefined, path);

export const missingField = (field: string, path?: string) =>
  createErrorResponse(ApiErrorCode.MISSING_FIELD, `${field} is required`, 400, { field }, path);

export const invalidFormat = (field: string, format: string, path?: string) =>
  createErrorResponse(ApiErrorCode.INVALID_FORMAT, `${field} must be ${format}`, 400, { field, format }, path);

// Helper to extract path from request
export function getRequestPath(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.pathname;
  } catch {
    return '';
  }
}

// Export types for use in other files
export type { ApiErrorResponse, ApiSuccessResponse };