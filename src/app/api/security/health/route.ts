import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { getSecurityHealth, SecurityLogger, SecurityEventType } from '@/lib/security/monitoring';

export async function GET(request: NextRequest) {
  try {
    // Only allow admin users to access security health
    const session = await auth();
    
    if (!session || !session.user.roles?.includes('admin')) {
      await SecurityLogger.log({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId: session?.user?.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        path: '/api/security/health',
        method: 'GET',
        severity: 'medium',
        details: { reason: 'Non-admin access attempt' },
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const health = await getSecurityHealth();
    
    return NextResponse.json(health, {
      status: health.status === 'critical' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Security health check error:', error);
    return NextResponse.json(
      { error: 'Failed to get security health' },
      { status: 500 }
    );
  }
}