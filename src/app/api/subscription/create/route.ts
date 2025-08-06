import { NextRequest, NextResponse } from 'next/server';
import { stripe, TRIAL_PERIOD_DAYS } from '@/lib/stripe/config';
import { SubscriptionTier } from '@/types';
import { 
  createSuccessResponse,
  badRequest,
  getRequestPath 
} from '@/lib/api/error-responses';
import { 
  validateRequest 
} from '@/lib/api/validate-request';
import { withStandardMiddleware } from '@/lib/api/middleware';
import { z } from 'zod';
import Stripe from 'stripe';

// Validation schema for subscription creation
const subscriptionCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  subscriptionTier: z.enum(['free', 'premium', 'premium_plus']),
  paymentMethodId: z.string().optional(),
});

async function createSubscriptionHandler(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const path = getRequestPath(request);

  // Validate request body
  const validation = validateRequest(subscriptionCreateSchema)(body, request);
  if ('error' in validation) {
    return validation.error;
  }

  const { customerId, priceId, subscriptionTier, paymentMethodId } = validation.data;

  // Mock user authentication - in production, get from session
  const userId = 'user_123'; // This should come from your auth system

  try {
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
      return createSuccessResponse({
        subscriptionId: subscription.id,
        paymentIntent: {
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      });
    }

    return createSuccessResponse({
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end,
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return badRequest(
        `Subscription creation failed: ${error.message}`, 
        { stripeErrorCode: error.code },
        path
      );
    }
    
    throw error; // Let middleware handle generic errors
  }
}

export const POST = withStandardMiddleware(createSubscriptionHandler);