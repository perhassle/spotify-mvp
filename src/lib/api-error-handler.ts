import { NextResponse } from 'next/server';

// Error types for categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  DATABASE = 'DATABASE_ERROR',
  PAYMENT = 'PAYMENT_ERROR',
}

// Custom API Error class
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly type: ErrorType;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    type: ErrorType = ErrorType.SERVER_ERROR,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = generateRequestId();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error creators
export const ApiErrors = {
  // 400 Bad Request
  badRequest: (message = 'Bad Request', details?: any) =>
    new ApiError(message, 400, ErrorType.VALIDATION, details),

  // 401 Unauthorized
  unauthorized: (message = 'Unauthorized') =>
    new ApiError(message, 401, ErrorType.AUTHENTICATION),

  // 403 Forbidden
  forbidden: (message = 'Forbidden') =>
    new ApiError(message, 403, ErrorType.AUTHORIZATION),

  // 404 Not Found
  notFound: (resource = 'Resource') =>
    new ApiError(`${resource} not found`, 404, ErrorType.NOT_FOUND),

  // 409 Conflict
  conflict: (message = 'Resource conflict', details?: any) =>
    new ApiError(message, 409, ErrorType.CONFLICT, details),

  // 429 Too Many Requests
  rateLimitExceeded: (retryAfter?: number) =>
    new ApiError(
      'Rate limit exceeded',
      429,
      ErrorType.RATE_LIMIT,
      { retryAfter }
    ),

  // 500 Internal Server Error
  internal: (message = 'Internal server error', details?: any) =>
    new ApiError(message, 500, ErrorType.SERVER_ERROR, details),

  // 502 Bad Gateway
  externalService: (service: string, details?: any) =>
    new ApiError(
      `External service error: ${service}`,
      502,
      ErrorType.EXTERNAL_SERVICE,
      details
    ),

  // Database errors
  database: (operation: string, details?: any) =>
    new ApiError(
      `Database error during ${operation}`,
      500,
      ErrorType.DATABASE,
      details
    ),

  // Payment errors
  payment: (message: string, details?: any) =>
    new ApiError(message, 402, ErrorType.PAYMENT, details),
};

// Generate a unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Error response formatter
interface ErrorResponse {
  error: {
    message: string;
    type: ErrorType;
    statusCode: number;
    timestamp: string;
    requestId: string;
    details?: any;
    stack?: string;
  };
}

// Format error for response
function formatError(error: ApiError | Error): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof ApiError) {
    return {
      error: {
        message: error.message,
        type: error.type,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        requestId: error.requestId || generateRequestId(),
        details: error.details,
        // Only include stack trace in development
        ...(isDevelopment && { stack: error.stack }),
      },
    };
  }

  // Handle generic errors
  return {
    error: {
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      type: ErrorType.SERVER_ERROR,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...(isDevelopment && { stack: error.stack }),
    },
  };
}

// Main error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      formatError(error),
      { 
        status: error.statusCode,
        headers: {
          'X-Request-Id': error.requestId || generateRequestId(),
        }
      }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('NEXT_NOT_FOUND')) {
      return NextResponse.json(
        formatError(ApiErrors.notFound()),
        { status: 404 }
      );
    }

    if (error.message.includes('Invalid token') || 
        error.message.includes('JWT')) {
      return NextResponse.json(
        formatError(ApiErrors.unauthorized()),
        { status: 401 }
      );
    }

    // Default error response
    return NextResponse.json(
      formatError(error),
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    formatError(new Error('An unexpected error occurred')),
    { status: 500 }
  );
}

// Async error wrapper for API routes
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

// Validation error helper
export function createValidationError(errors: Record<string, string[]>): ApiError {
  const message = 'Validation failed';
  const details = {
    errors,
    count: Object.keys(errors).length,
  };
  
  return ApiErrors.badRequest(message, details);
}

// Type guard for API errors
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// Error logger for production
export async function logError(
  error: Error | ApiError,
  context?: Record<string, any>
): Promise<void> {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(isApiError(error) && {
        type: error.type,
        statusCode: error.statusCode,
        requestId: error.requestId,
        details: error.details,
      }),
    },
    context,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
    },
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: await sendToErrorTracking(errorLog);
    console.error('Production Error:', JSON.stringify(errorLog));
  } else {
    console.error('Development Error:', errorLog);
  }
}