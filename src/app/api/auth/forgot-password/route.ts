import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { forgotPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedFields = forgotPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validatedFields.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { email } = validatedFields.data;

    // Check if user exists
    const user = await authDB.getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
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

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while processing your request' 
      },
      { status: 500 }
    );
  }
}