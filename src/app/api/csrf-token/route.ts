import { NextResponse } from 'next/server';
import { setCsrfToken, getCsrfToken } from '@/lib/security/csrf';

export async function GET() {
  try {
    // Get existing token or generate new one
    let token = await getCsrfToken();
    
    if (!token) {
      token = await setCsrfToken();
    }
    
    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}