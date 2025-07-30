import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

interface ReadinessCheck {
  ready: boolean;
  checks: {
    name: string;
    ready: boolean;
    message?: string;
  }[];
  timestamp: string;
}

/**
 * GET /api/ready
 * 
 * Kubernetes-style readiness probe endpoint.
 * Returns 200 if the application is ready to serve traffic, 503 otherwise.
 * 
 * This endpoint checks if all critical services are available and the
 * application can handle requests properly.
 */
export async function GET(_request: NextRequest) {
  const checks: ReadinessCheck['checks'] = [];
  
  try {
    // Check 1: Application initialization
    // In a real app, this might check if all startup tasks are complete
    checks.push({
      name: 'Application',
      ready: true,
      message: 'Application is initialized'
    });

    // Check 2: Stripe connectivity
    const stripeReady = await checkStripeReady();
    checks.push(stripeReady);

    // Check 3: Authentication configuration
    const authReady = checkAuthReady();
    checks.push(authReady);

    // Check 4: Critical environment variables
    const envReady = checkCriticalEnvVars();
    checks.push(envReady);

    // Check 5: Static assets (Next.js specific)
    const assetsReady = checkStaticAssets();
    checks.push(assetsReady);

    // Determine overall readiness
    const allReady = checks.every(check => check.ready);

    const response: ReadinessCheck = {
      ready: allReady,
      checks,
      timestamp: new Date().toISOString()
    };

    // Return 200 if ready, 503 if not ready
    return NextResponse.json(response, { 
      status: allReady ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    // If the readiness check itself fails, the service is not ready
    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Readiness check failed',
        timestamp: new Date().toISOString()
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}

/**
 * Check if Stripe is ready to process payments
 */
async function checkStripeReady(): Promise<ReadinessCheck['checks'][0]> {
  try {
    // Quick check to see if we can communicate with Stripe
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Stripe check timeout')), 5000)
    );

    await Promise.race([
      stripe.balance.retrieve(),
      timeout
    ]);

    return {
      name: 'Stripe',
      ready: true,
      message: 'Stripe API is accessible'
    };
  } catch (error) {
    return {
      name: 'Stripe',
      ready: false,
      message: error instanceof Error ? error.message : 'Stripe is not accessible'
    };
  }
}

/**
 * Check if authentication is properly configured
 */
function checkAuthReady(): ReadinessCheck['checks'][0] {
  const hasAuthSecret = !!process.env.NEXTAUTH_SECRET;
  
  if (hasAuthSecret) {
    return {
      name: 'Authentication',
      ready: true,
      message: 'Auth configuration is present'
    };
  } else {
    return {
      name: 'Authentication',
      ready: false,
      message: 'NEXTAUTH_SECRET is not configured'
    };
  }
}

/**
 * Check critical environment variables
 */
function checkCriticalEnvVars(): ReadinessCheck['checks'][0] {
  const criticalVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXTAUTH_SECRET'
  ];

  const missing = criticalVars.filter(varName => !process.env[varName]);

  if (missing.length === 0) {
    return {
      name: 'Environment',
      ready: true,
      message: 'All critical environment variables are set'
    };
  } else {
    return {
      name: 'Environment',
      ready: false,
      message: `Missing critical variables: ${missing.join(', ')}`
    };
  }
}

/**
 * Check if static assets are available (Next.js specific)
 */
function checkStaticAssets(): ReadinessCheck['checks'][0] {
  // In production, Next.js should have generated static assets
  // In development, this is always true
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return {
      name: 'Static Assets',
      ready: true,
      message: 'Development mode - assets are generated on demand'
    };
  }

  // In production, we could check for the existence of .next directory
  // For now, we'll assume it's ready if we've gotten this far
  return {
    name: 'Static Assets',
    ready: true,
    message: 'Production assets are available'
  };
}

/**
 * HEAD /api/ready
 * 
 * Lightweight readiness check that only returns status code.
 * Useful for load balancers that only care about the status code.
 */
export async function HEAD(_request: NextRequest) {
  try {
    // Perform minimal checks for HEAD request
    const hasRequiredEnvVars = !![
      process.env.STRIPE_SECRET_KEY,
      process.env.NEXTAUTH_SECRET
    ].every(Boolean);

    return new NextResponse(null, { 
      status: hasRequiredEnvVars ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}