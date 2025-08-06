import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { resetPasswordSchema } from '@/lib/auth/validation';
import { 
  createSuccessResponse,
  badRequest,
  getRequestPath 
} from '@/lib/api/error-responses';
import { 
  validateRequest 
} from '@/lib/api/validate-request';
import { withStandardMiddleware } from '@/lib/api/middleware';

async function resetPasswordHandler(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const path = getRequestPath(request);

  // Validate request body
  const validation = validateRequest(resetPasswordSchema)(body, request);
  if ('error' in validation) {
    return validation.error;
  }

  const { token, password } = validation.data;

  // Reset password
  const success = await authDB.resetPassword(token, password);

  if (!success) {
    return badRequest('Invalid or expired reset token', undefined, path);
  }

  return createSuccessResponse({
    message: 'Password has been reset successfully'
  });
}

export const POST = withStandardMiddleware(resetPasswordHandler);