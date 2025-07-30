import { NextRequest, NextResponse } from 'next/server';
import { stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe/config';
import { SubscriptionTier } from '@/types';
import { ApiError } from '@/types/common';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, priceId, subscriptionTier, paymentMethodId } = body;

    // Mock user authentication - in production, get from session
    const userId = 'user_123'; // This should come from your auth system

    // Validate inputs
    if (!customerId || !priceId || !subscriptionTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Attach payment method to customer if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: TRIAL_PERIOD_DAYS,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId,
        subscriptionTier,
      },
    });

    // Get the payment intent from the subscription's latest invoice
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = (invoice as any)?.payment_intent as Stripe.PaymentIntent | null;

    if (paymentIntent?.status === 'requires_action') {
      return NextResponse.json({
        subscriptionId: subscription.id,
        paymentIntent: {
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      });
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end,
    });

  } catch (error) {
    const apiError = error as ApiError;
    console.error('Create subscription error:', apiError);
    return NextResponse.json(
      { error: apiError.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}