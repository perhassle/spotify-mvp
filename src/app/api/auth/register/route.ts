import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { registrationSchema } from '@/lib/auth/validation';
import { logger } from '@/lib/logger';
import { withLogging, auditMiddleware, performanceMiddleware } from '@/middleware/logging';
import { BruteForceDetector, SecurityLogger, SecurityEventType } from '@/lib/security/monitoring';
import { sanitizeObject } from '@/lib/security/sanitization';
import { handleApiError, ApiErrors } from '@/lib/api-error-handler';
import { extractRequestMetadata } from '@/lib/security/monitoring';

async function registerHandler(request: NextRequest) {
  // Get request ID from headers (set by middleware)
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const requestLogger = logger.child({ requestId, operation: 'user.register' });
  const metadata = extractRequestMetadata(request);

  try {
    requestLogger.info('Processing user registration');
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    // Validate request body
    const validatedFields = registrationSchema.safeParse(body);

    if (!validatedFields.success) {
      requestLogger.warn('Registration validation failed', {
        errors: validatedFields.error.flatten().fieldErrors
      });
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { email, username, displayName, password } = validatedFields.data;

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
      throw ApiErrors.rateLimitExceeded(15 * 60); // 15 minutes
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

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      }
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
    
    // Use centralized error handler
    return handleApiError(error);
  }
}

// Export the handler with logging, performance, and audit middleware
export const POST = withLogging(
  performanceMiddleware('auth.register')(
    auditMiddleware('user', 'create')(registerHandler)
  )
);