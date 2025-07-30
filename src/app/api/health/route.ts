import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

interface HealthCheckComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  components: HealthCheckComponent[];
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// Track application start time
const startTime = Date.now();

/**
 * GET /api/health
 * 
 * Health check endpoint that returns the application health status.
 * Supports both simple and detailed health checks.
 * 
 * Query parameters:
 * - detailed=true: Returns detailed health check information
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const detailed = searchParams.get('detailed') === 'true';

  try {
    // Simple health check - just return 200 OK
    if (!detailed) {
      return NextResponse.json(
        { 
          status: 'healthy',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    // Detailed health check
    const components: HealthCheckComponent[] = [];
    
    // Check Stripe connectivity
    const stripeCheck = await checkStripeConnection();
    components.push(stripeCheck);

    // Check mock data availability (simulating database check)
    const dataCheck = checkMockDataAvailability();
    components.push(dataCheck);

    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    components.push(envCheck);

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryInfo = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    };

    // Calculate overall status
    const unhealthyComponents = components.filter(c => c.status === 'unhealthy');
    const degradedComponents = components.filter(c => c.status === 'degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyComponents.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedComponents.length > 0) {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor((Date.now() - startTime) / 1000), // seconds
      environment: process.env.NODE_ENV || 'development',
      components,
      memory: memoryInfo
    };

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    // Critical error - return 503 Service Unavailable
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 503 }
    );
  }
}

/**
 * Check Stripe API connectivity
 */
async function checkStripeConnection(): Promise<HealthCheckComponent> {
  const start = Date.now();
  
  try {
    // Try to retrieve balance as a simple connectivity check
    await stripe.balance.retrieve();
    
    return {
      name: 'Stripe API',
      status: 'healthy',
      message: 'Successfully connected to Stripe',
      responseTime: Date.now() - start,
      details: {
        // API version is set in the Stripe instance configuration
      }
    };
  } catch (error) {
    return {
      name: 'Stripe API',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Failed to connect to Stripe',
      responseTime: Date.now() - start
    };
  }
}

/**
 * Check mock data availability (simulating database check)
 */
function checkMockDataAvailability(): HealthCheckComponent {
  try {
    // In a real application, this would check database connectivity
    // For now, we'll just verify that our mock data modules exist
    const mockDataModules = [
      '@/lib/data/mock-albums',
      '@/lib/data/mock-artists',
      '@/lib/data/mock-playlists',
      '@/lib/data/mock-tracks'
    ];

    // Check if mock data is accessible
    const dataAvailable = mockDataModules.every(module => {
      try {
        require.resolve(module);
        return true;
      } catch {
        return false;
      }
    });

    if (dataAvailable) {
      return {
        name: 'Data Store',
        status: 'healthy',
        message: 'Mock data is available',
        details: {
          type: 'mock',
          modules: mockDataModules
        }
      };
    } else {
      return {
        name: 'Data Store',
        status: 'degraded',
        message: 'Some mock data modules are missing'
      };
    }
  } catch (error) {
    return {
      name: 'Data Store',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Failed to check data availability'
    };
  }
}

/**
 * Check required environment variables
 */
function checkEnvironmentVariables(): HealthCheckComponent {
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const optionalVars = [
    'EMAIL_FROM',
    'EMAIL_SERVER',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missingRequired = requiredVars.filter(varName => !process.env[varName]);
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);

  if (missingRequired.length === 0) {
    return {
      name: 'Environment',
      status: missingOptional.length > 0 ? 'degraded' : 'healthy',
      message: missingOptional.length > 0 
        ? `Missing optional variables: ${missingOptional.join(', ')}`
        : 'All environment variables are configured',
      details: {
        required: requiredVars.length,
        optional: optionalVars.length,
        missingRequired: missingRequired.length,
        missingOptional: missingOptional.length
      }
    };
  } else {
    return {
      name: 'Environment',
      status: 'unhealthy',
      message: `Missing required variables: ${missingRequired.join(', ')}`,
      details: {
        missingRequired,
        missingOptional
      }
    };
  }
}