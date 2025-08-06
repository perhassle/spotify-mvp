import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { forgotPasswordSchema } from '@/lib/auth/validation';
import { 
  createSuccessResponse,
  getRequestPath 
} from '@/lib/api/error-responses';
import { 
  validateRequest 
} from '@/lib/api/validate-request';
import { withStandardMiddleware } from '@/lib/api/middleware';

async function forgotPasswordHandler(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const path = getRequestPath(request);

  // Validate request body
  const validation = validateRequest(forgotPasswordSchema)(body, request);
  if ('error' in validation) {
    return validation.error;
  }

  const { email } = validation.data;

  // Check if user exists
  const user = await authDB.getUserByEmail(email);
  
  if (!user) {
    // Don't reveal if email exists or not for security
    // Return same response regardless
    return createSuccessResponse({
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    });
  }

  // Generate reset token
  const resetToken = await authDB.setResetToken(email);

  if (!resetToken) {
    throw new Error('Failed to generate reset token');
  }

  // In a real app, you would send an email here
  // For now, we'll just log the reset link
  console.log(`Password reset link for ${email}: http://localhost:3000/auth/reset-password?token=${resetToken}`);

  return createSuccessResponse({
    message: 'If an account with that email exists, we\'ve sent a password reset link.',
    // In development, include the token for testing
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
}

export const POST = withStandardMiddleware(forgotPasswordHandler);