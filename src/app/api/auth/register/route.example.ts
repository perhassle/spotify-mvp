import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/auth/database';
import { registrationSchema } from '@/lib/auth/validation';
import { 
  withErrorHandler, 
  ApiErrors, 
  createValidationError 
} from '@/lib/api-error-handler';
import { ApiError } from '@/types/common';

// Example of using the error handler with the registration route
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Validate request body
  const validatedFields = registrationSchema.safeParse(body);

  if (!validatedFields.success) {
    // Use the validation error helper
    throw createValidationError(validatedFields.error.flatten().fieldErrors);
  }

  const { email, username, displayName, password } = validatedFields.data;

  try {
    // Create user
    const user = await authDB.createUser(email, password, username, displayName);

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
    const apiError = error as ApiError;
    
    // Handle specific database errors
    if ('code' in apiError && apiError.code === 'P2002' || apiError.message?.includes('already exists')) {
      throw ApiErrors.conflict('User with this email or username already exists', {
        field: apiError.message?.includes('email') ? 'email' : 'username'
      });
    }

    // Handle other database errors
    if ('code' in apiError && apiError.code?.startsWith('P')) {
      throw ApiErrors.database('user creation', { code: apiError.code });
    }

    // Re-throw unknown errors to be handled by the wrapper
    throw apiError;
  }
});