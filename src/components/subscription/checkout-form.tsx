'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/stripe/config';
import { SubscriptionTier, PromoCode } from '@/types';
import { cn } from '@/lib/utils';

interface CheckoutFormProps {
  subscriptionTier: SubscriptionTier;
  billingPeriod: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  clientSecret: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: string) => void;
}

export function CheckoutForm({
  subscriptionTier,
  billingPeriod,
  amount,
  currency,
  clientSecret,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [orderSummary, setOrderSummary] = useState({
    subtotal: amount,
    discount: 0,
    tax: 0,
    total: amount,
  });

  useEffect(() => {
    // Calculate tax (mock implementation)
    const taxRate = 0.08; // 8% tax
    const subtotal = amount - (appliedPromo ? orderSummary.discount : 0);
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + tax;

    setOrderSummary({
      subtotal: amount,
      discount: appliedPromo ? orderSummary.discount : 0,
      tax,
      total,
    });
  }, [amount, appliedPromo, orderSummary.discount]);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsApplyingPromo(true);
    setPromoError('');

    try {
      const response = await fetch('/api/subscription/promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: promoCode.trim(),
          subscriptionTier,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid promo code');
      }

      const discount = data.promo.discountType === 'percentage' 
        ? (amount * data.promo.discountValue) / 100
        : data.promo.discountValue;

      setAppliedPromo(data.promo);
      setOrderSummary(prev => ({ ...prev, discount }));
      setPromoError('');
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : 'Invalid promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    setOrderSummary(prev => ({ ...prev, discount: 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, subscription should be created via webhook
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierDisplayName = (tier: SubscriptionTier): string => {
    switch (tier) {
      case 'premium': return 'Premium';
      case 'student': return 'Premium Student';
      case 'family': return 'Premium Family';
      default: return 'Free';
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-lg bg-gray-50 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {getTierDisplayName(subscriptionTier)}
                </p>
                <p className="text-sm text-gray-600">
                  Billed {billingPeriod}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                {formatPrice(orderSummary.subtotal, currency)}
              </p>
            </div>

            {appliedPromo && (
              <div className="flex justify-between text-green-600">
                <div>
                  <p className="font-medium">Promo: {appliedPromo.name}</p>
                  <button
                    onClick={handleRemovePromoCode}
                    className="text-xs underline hover:no-underline"
                  >
                    Remove
                  </button>
                </div>
                <p className="font-medium">
                  -{formatPrice(orderSummary.discount, currency)}
                </p>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <p>Tax</p>
              <p>{formatPrice(orderSummary.tax, currency)}</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <p className="text-lg font-semibold text-gray-900">Total</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(orderSummary.total, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Promo Code Section */}
          {!appliedPromo && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyPromoCode}
                  variant="outline"
                  disabled={!promoCode.trim() || isApplyingPromo}
                  className="whitespace-nowrap"
                >
                  {isApplyingPromo ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              {promoError && (
                <p className="mt-2 text-sm text-red-600">{promoError}</p>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="text-xs text-gray-600 space-y-1">
              <p>• 7-day free trial for new subscribers</p>
              <p>• Cancel anytime before trial ends</p>
              <p>• Secure payment processing by Stripe</p>
              <p>• Immediate access to premium features</p>
            </div>
          </div>
        </motion.div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-lg bg-white p-6 shadow-sm border"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Element */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="rounded-md border border-gray-300 p-3">
                <PaymentElement 
                  options={{
                    layout: 'tabs',
                  }}
                />
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Address
              </label>
              <div className="rounded-md border border-gray-300 p-3">
                <AddressElement 
                  options={{
                    mode: 'billing',
                  }}
                />
              </div>
            </div>

            {/* Terms and Privacy */}
            <div className="text-xs text-gray-600">
              <p>
                By completing your purchase, you agree to our{' '}
                <a href="/terms" className="text-blue-600 underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!stripe || !elements || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </div>
              ) : (
                `Start Free Trial - ${formatPrice(orderSummary.total, currency)}/${billingPeriod}`
              )}
            </Button>

            <div className="text-center text-xs text-gray-500">
              <p>You won&apos;t be charged until your free trial ends</p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}