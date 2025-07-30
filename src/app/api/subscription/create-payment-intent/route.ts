import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRODUCTS, TRIAL_PERIOD_DAYS } from '@/lib/stripe/config';
import { SubscriptionTier } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionTier, billingPeriod, priceId } = body;

    // Mock user authentication - in production, get from session
    const userId = 'user_123'; // This should come from your auth system
    const userEmail = 'user@example.com'; // This should come from your auth system

    // Validate subscription tier
    if (!['premium', 'student', 'family'].includes(subscriptionTier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Get price information
    const productConfig = STRIPE_PRODUCTS[subscriptionTier as keyof typeof STRIPE_PRODUCTS];
    if (!productConfig) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    const pricing = billingPeriod === 'yearly' && 'yearly' in productConfig 
      ? productConfig.yearly 
      : productConfig.monthly;

    if (!pricing || pricing.priceId !== priceId) {
      return NextResponse.json(
        { error: 'Invalid price configuration' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customer;
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId,
          },
        });
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Failed to create or find customer' },
        { status: 500 }
      );
    }

    // Calculate amount in cents
    const amount = Math.round(pricing.price * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: pricing.currency,
      customer: customer.id,
      setup_future_usage: 'off_session',
      metadata: {
        userId,
        subscriptionTier,
        billingPeriod,
        priceId,
        trialDays: TRIAL_PERIOD_DAYS.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      amount,
      currency: pricing.currency,
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}