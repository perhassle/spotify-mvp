import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRODUCTS } from '@/lib/stripe/config';

/**
 * Test endpoint for validating Stripe integration
 * This should only be available in development
 */

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const tests = [];

    // Test 1: Stripe Connection
    try {
      const balance = await stripe.balance.retrieve();
      tests.push({
        name: 'Stripe Connection',
        status: 'passed',
        message: 'Successfully connected to Stripe',
        data: { available: balance.available, pending: balance.pending }
      });
    } catch (error) {
      tests.push({
        name: 'Stripe Connection',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Product Configuration
    try {
      const premiumMonthly = await stripe.prices.retrieve(STRIPE_PRODUCTS.premium.monthly.priceId);
      tests.push({
        name: 'Premium Monthly Price',
        status: premiumMonthly ? 'passed' : 'failed',
        message: premiumMonthly 
          ? `Price found: ${(premiumMonthly.unit_amount || 0) / 100} ${premiumMonthly.currency}`
          : 'Price not found',
        data: premiumMonthly
      });
    } catch (error) {
      tests.push({
        name: 'Premium Monthly Price',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Webhook Secret
    tests.push({
      name: 'Webhook Secret',
      status: process.env.STRIPE_WEBHOOK_SECRET ? 'passed' : 'failed',
      message: process.env.STRIPE_WEBHOOK_SECRET 
        ? 'Webhook secret is configured'
        : 'Webhook secret is missing'
    });

    // Test 4: Create Test Customer
    try {
      const customer = await stripe.customers.create({
        email: 'test@example.com',
        name: 'Test Customer',
        metadata: { test: 'true' }
      });

      // Clean up - delete the test customer
      await stripe.customers.del(customer.id);

      tests.push({
        name: 'Customer Creation',
        status: 'passed',
        message: 'Successfully created and deleted test customer',
        data: { customerId: customer.id }
      });
    } catch (error) {
      tests.push({
        name: 'Customer Creation',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Environment Variables
    const requiredEnvVars = [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    tests.push({
      name: 'Environment Variables',
      status: missingEnvVars.length === 0 ? 'passed' : 'failed',
      message: missingEnvVars.length === 0 
        ? 'All required environment variables are set'
        : `Missing environment variables: ${missingEnvVars.join(', ')}`,
      data: { missing: missingEnvVars }
    });

    // Calculate overall status
    const failedTests = tests.filter(test => test.status === 'failed');
    const overallStatus = failedTests.length === 0 ? 'all_passed' : 'some_failed';

    return NextResponse.json({
      overall: overallStatus,
      summary: {
        total: tests.length,
        passed: tests.filter(test => test.status === 'passed').length,
        failed: failedTests.length
      },
      tests,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Test execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Test webhook endpoint
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { testType, ...params } = body;

    switch (testType) {
      case 'create_payment_intent':
        return await testCreatePaymentIntent(params);
      
      case 'validate_promo_code':
        return await testValidatePromoCode(params);
      
      case 'simulate_webhook':
        return await testSimulateWebhook(params);
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        );
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Test execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function testCreatePaymentIntent(params: any) {
  try {
    const { subscriptionTier = 'premium', billingPeriod = 'monthly' } = params;
    
    const response = await fetch('http://localhost:3001/api/subscription/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionTier,
        billingPeriod,
        priceId: STRIPE_PRODUCTS[subscriptionTier as keyof typeof STRIPE_PRODUCTS].monthly.priceId
      })
    });

    const data = await response.json();

    return NextResponse.json({
      test: 'create_payment_intent',
      status: response.ok ? 'passed' : 'failed',
      message: response.ok ? 'Payment intent created successfully' : data.error,
      data: response.ok ? data : null
    });

  } catch (error) {
    return NextResponse.json({
      test: 'create_payment_intent',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testValidatePromoCode(params: any) {
  try {
    const { code = 'WELCOME20', subscriptionTier = 'premium', billingPeriod = 'monthly' } = params;
    
    const response = await fetch('http://localhost:3001/api/subscription/promo-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subscriptionTier, billingPeriod })
    });

    const data = await response.json();

    return NextResponse.json({
      test: 'validate_promo_code',
      status: response.ok ? 'passed' : 'failed',
      message: response.ok ? 'Promo code validated successfully' : data.error,
      data: response.ok ? data : null
    });

  } catch (error) {
    return NextResponse.json({
      test: 'validate_promo_code',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testSimulateWebhook(params: any) {
  // This would simulate a webhook event in a real implementation
  // For now, just return a mock response
  return NextResponse.json({
    test: 'simulate_webhook',
    status: 'passed',
    message: 'Webhook simulation completed (mock)',
    data: {
      eventType: params.eventType || 'customer.subscription.created',
      processed: true,
      timestamp: new Date().toISOString()
    }
  });
}