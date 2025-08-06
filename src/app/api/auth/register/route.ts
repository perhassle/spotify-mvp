import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { registrationSchema } from '@/lib/auth/validation';
import { logger } from '@/lib/logger';
import { withLogging, auditMiddleware, performanceMiddleware } from '@/middleware/logging';
import { BruteForceDetector, SecurityLogger, SecurityEventType } from '@/lib/security/monitoring';
import { sanitizeObject } from '@/lib/security/sanitization';
import { 
  createSuccessResponse, 
  rateLimited, 
  getRequestPath 
} from '@/lib/api/error-responses';
import { 
  validateRequest, 
  registerSchema 
} from '@/lib/api/validate-request';
import { withStandardMiddleware } from '@/lib/api/middleware';
import { extractRequestMetadata } from '@/lib/security/monitoring';

async function registerHandler(request: NextRequest): Promise<NextResponse> {
  // Get request ID from headers (set by middleware)
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const requestLogger = logger.child({ requestId, operation: 'user.register' });
  const metadata = extractRequestMetadata(request);
  const path = getRequestPath(request);

  try {
    requestLogger.info('Processing user registration');
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Validate request body using standardized validation
    const validation = validateRequest(registerSchema)(body, request);
    if ('error' in validation) {
      requestLogger.warn('Registration validation failed');
      return validation.error;
    }

    const { email, username, displayName, password } = validation.data;

    // Check for brute force attempts
    const bruteForceCheck = await BruteForceDetector.checkBruteForce(
      metadata.ipAddress || 'unknown',
      'login'
    );

    if (bruteForceCheck.blocked) {
      await SecurityLogger.log({
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        ...metadata,
        severity: 'high',
        details: { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') },
      });
      return rateLimited('Too many registration attempts. Please try again later.', {
        retryAfter: 15 * 60, // 15 minutes
        blocked: true
      }, path);
    }

    // Log registration attempt (without sensitive data)
    requestLogger.info('Creating new user', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      username,
      displayName
    });

    // Create user with timing
    const endTimer = requestLogger.startTimer('database.createUser');
    const user = await authDB.createUser(email, password, username, displayName);
    endTimer();

    // Log successful registration
    requestLogger.info('User registration successful', {
      userId: user.id,
      username: user.username
    });

    // Log security event
    await SecurityLogger.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId: user.id,
      ...metadata,
      severity: 'low',
      details: { action: 'registration' },
    });

    // Audit log for compliance
    requestLogger.audit('create', 'user', 'success', {
      userId: user.id,
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });

    // Track feature usage
    requestLogger.feature('auth', 'register', {
      registrationMethod: 'email'
    });

    return createSuccessResponse({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as Error & {code?: string}).code : undefined;
    
    requestLogger.error('Registration failed', error, {
      errorCode,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    });

    // Audit log for failed registration
    requestLogger.audit('create', 'user', 'failure', {
      error: errorMessage
    });

    // Log security event for failed registration
    await SecurityLogger.log({
      type: SecurityEventType.LOGIN_FAILURE,
      ...metadata,
      severity: 'medium',
      details: { 
        action: 'registration',
        error: errorMessage 
      },
    });
    
    // Re-throw to be handled by middleware error handler
    throw error;
  }
}

// Export the handler with new middleware and existing logging
export const POST = withLogging(
  performanceMiddleware('auth.register')(
    auditMiddleware('user', 'create')(
      withStandardMiddleware(registerHandler)
    )
  )
);