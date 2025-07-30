/**
 * Lazy load Stripe to reduce initial bundle size
 * Only load when needed for payment operations
 */

import type { Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe();
  }
  return stripePromise;
};

async function loadStripe() {
  // Dynamically import Stripe.js
  const { loadStripe } = await import('@stripe/stripe-js');
  
  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) {
    console.error('Stripe publishable key not found');
    return null;
  }
  
  return loadStripe(stripeKey);
}

/**
 * Preload Stripe when user shows intent to upgrade
 * Call this on hover/focus of upgrade buttons
 */
export function preloadStripe() {
  if (!stripePromise) {
    getStripe();
  }
}