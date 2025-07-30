import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';

/**
 * Stripe configuration and initialization
 */

// Server-side Stripe instance (lazy initialization)
let stripeInstance: Stripe | null = null;

export const getStripeServer = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });
  }
  return stripeInstance;
};

// Backward compatibility - export stripe as a getter
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripeServer()[prop as keyof Stripe];
  }
});

// Client-side Stripe promise
let stripePromise: Promise<StripeJS | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || (
      process.env.NODE_ENV === 'test' || process.env.CI ? 'pk_test_dummy' : undefined
    );
    
    if (!publishableKey) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Subscription product and price configurations
export const STRIPE_PRODUCTS = {
  premium: {
    monthly: {
      priceId: 'price_premium_monthly',
      price: 9.99,
      currency: 'usd',
      interval: 'month' as const,
    },
    yearly: {
      priceId: 'price_premium_yearly',
      price: 99.99,
      currency: 'usd',
      interval: 'year' as const,
    },
  },
  student: {
    monthly: {
      priceId: 'price_student_monthly',
      price: 4.99,
      currency: 'usd',
      interval: 'month' as const,
    },
  },
  family: {
    monthly: {
      priceId: 'price_family_monthly',
      price: 14.99,
      currency: 'usd',
      interval: 'month' as const,
    },
    yearly: {
      priceId: 'price_family_yearly',
      price: 149.99,
      currency: 'usd',
      interval: 'year' as const,
    },
  },
} as const;

// Trial period configuration
export const TRIAL_PERIOD_DAYS = 7;

// Feature mapping for Stripe metadata
export const SUBSCRIPTION_FEATURES = {
  free: [
    'basic_playback',
    'limited_skips',
    'ads',
    'low_quality_audio',
  ],
  premium: [
    'unlimited_skips',
    'high_quality_audio',
    'ad_free_listening',
    'offline_downloads',
    'equalizer_access',
    'crossfade',
    'custom_playlist_artwork',
    'advanced_visualizer',
  ],
  student: [
    'unlimited_skips',
    'high_quality_audio',
    'ad_free_listening',
    'offline_downloads',
    'equalizer_access',
    'crossfade',
    'custom_playlist_artwork',
    'advanced_visualizer',
  ],
  family: [
    'unlimited_skips',
    'high_quality_audio',
    'ad_free_listening',
    'offline_downloads',
    'equalizer_access',
    'crossfade',
    'custom_playlist_artwork',
    'advanced_visualizer',
    'family_sharing',
    'multiple_accounts',
  ],
} as const;

// Webhook event types we handle
export const HANDLED_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
  'payment_method.attached',
] as const;

// Currency formatting
export const formatPrice = (price: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
};

// Tax rates (mock for demo)
export const TAX_RATES = {
  US: 0.08, // 8% tax rate
  EU: 0.20, // 20% VAT
  default: 0.10, // 10% default
} as const;

// Calculate tax
export const calculateTax = (amount: number, country: string = 'US'): number => {
  const rate = TAX_RATES[country as keyof typeof TAX_RATES] || TAX_RATES.default;
  return Math.round(amount * rate * 100) / 100;
};

// Stripe configuration for different payment methods
export const PAYMENT_METHOD_TYPES = [
  'card',
  'paypal',
  'us_bank_account',
] as const;

// Error messages
export const STRIPE_ERROR_MESSAGES = {
  card_declined: 'Your card was declined. Please try a different payment method.',
  insufficient_funds: 'Your card has insufficient funds. Please try a different payment method.',
  expired_card: 'Your card has expired. Please update your payment information.',
  incorrect_cvc: 'Your card\'s security code is incorrect. Please try again.',
  processing_error: 'An error occurred while processing your payment. Please try again.',
  incomplete_number: 'Your card number is incomplete. Please enter a valid card number.',
  incomplete_cvc: 'Your card\'s security code is incomplete. Please enter a valid CVC.',
  incomplete_expiry: 'Your card\'s expiration date is incomplete. Please enter a valid expiration date.',
  generic_decline: 'Your payment was declined. Please try a different payment method.',
} as const;

// Subscription status mapping
export const mapStripeSubscriptionStatus = (
  stripeStatus: Stripe.Subscription.Status
): import('@/types').SubscriptionStatus => {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
      return 'unpaid';
    case 'incomplete':
    case 'incomplete_expired':
      return 'expired';
    default:
      return 'expired';
  }
};