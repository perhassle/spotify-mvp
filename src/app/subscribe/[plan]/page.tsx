'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getStripe, STRIPE_PRODUCTS } from '@/lib/stripe/config';
import { CheckoutForm } from '@/components/subscription/checkout-form';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { SubscriptionTier } from '@/types';

interface SubscribePageProps {
  params: Promise<{
    plan: SubscriptionTier;
  }>;
}

export default function SubscribePage({ params }: SubscribePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [plan, setPlan] = useState<SubscriptionTier | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const billingPeriod = (searchParams.get('billing') as 'monthly' | 'yearly') || 'monthly';
  
  const isValidPlan = plan && ['premium', 'student', 'family'].includes(plan);

  // Resolve params
  useEffect(() => {
    params.then(resolvedParams => {
      setPlan(resolvedParams.plan);
    });
  }, [params]);

  // Get pricing info
  const getPricingInfo = () => {
    if (!plan) return null;
    const productConfig = STRIPE_PRODUCTS[plan as keyof typeof STRIPE_PRODUCTS];
    if (!productConfig) return null;

    const pricing = billingPeriod === 'yearly' && 'yearly' in productConfig 
      ? productConfig.yearly 
      : productConfig.monthly;

    return pricing;
  };

  const pricingInfo = getPricingInfo();

  useEffect(() => {
    if (!isValidPlan) {
      router.push('/pricing');
    }
  }, [isValidPlan, router]);

  useEffect(() => {
    if (!user) {
      router.push(`/auth/login?redirect=/subscribe/${plan || 'premium'}?billing=${billingPeriod}`);
      return;
    }

    if (!pricingInfo) {
      setError('Invalid subscription plan');
      setIsLoading(false);
      return;
    }

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/subscription/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionTier: plan,
            billingPeriod,
            priceId: pricingInfo.priceId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize checkout');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, plan, billingPeriod, pricingInfo, router]);

  const handleSuccess = (subscriptionId: string) => {
    router.push(`/subscription/success?subscription=${subscriptionId}`);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBack = () => {
    router.push('/pricing');
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isValidPlan) {
    return null; // Will redirect to pricing
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!pricingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Plan</h1>
          <p className="mt-2 text-gray-600">The requested subscription plan is not available.</p>
          <Button onClick={() => router.push('/pricing')} className="mt-4">
            View Available Plans
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Setting up your checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-red-100 p-3 mx-auto w-fit mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Checkout Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6 space-x-4">
            <Button onClick={handleBack} variant="outline">
              Back to Pricing
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stripePromise = getStripe();

  const getTierDisplayName = (tier: SubscriptionTier): string => {
    switch (tier) {
      case 'premium': return 'Premium';
      case 'student': return 'Premium Student';
      case 'family': return 'Premium Family';
      default: return 'Free';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Plans
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your {getTierDisplayName(plan)} Subscription
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Join millions of users enjoying premium music streaming
          </p>
        </motion.div>

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2563eb',
                  colorBackground: '#ffffff',
                  colorText: '#374151',
                  colorDanger: '#ef4444',
                  fontFamily: 'system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <CheckoutForm
              subscriptionTier={plan}
              billingPeriod={billingPeriod}
              amount={pricingInfo.price}
              currency={pricingInfo.currency}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        )}
      </div>

      {/* Security badges */}
      <div className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL Secured
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              PCI Compliant
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Stripe Powered
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel Anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}