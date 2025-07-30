import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { resetPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedFields = resetPasswordSchema.safeParse(body);

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

    const { token, password } = validatedFields.data;

    // Reset password
    const success = await authDB.resetPassword(token, password);

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid or expired reset token' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while resetting your password' 
      },
      { status: 500 }
    );
  }
}