'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { STRIPE_PRODUCTS, formatPrice } from '@/lib/stripe/config';
import { preloadStripe } from '@/lib/stripe/lazy-stripe';
import { SubscriptionPlan, SubscriptionTier } from '@/types';
import { cn } from '@/lib/utils';

interface PricingPageProps {
  onSelectPlan: (tier: SubscriptionTier, billing: 'monthly' | 'yearly') => void;
  currentTier?: SubscriptionTier;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    description: 'Perfect for casual listeners',
    features: [
      'Basic music playback',
      'Limited skips (6 per hour)',
      'Audio ads between songs',
      'Standard audio quality (128kbps)',
      'Shuffle play only',
      '50 playlists maximum'
    ],
    pricing: {},
    trialDays: 0,
  },
  {
    id: 'premium',
    tier: 'premium',
    name: 'Premium',
    description: 'The complete music experience',
    features: [
      'Ad-free music listening',
      'Unlimited skips',
      'High-quality audio (320kbps)',
      'Offline downloads',
      'Advanced equalizer',
      'Crossfade between tracks',
      'Custom playlist artwork',
      'Advanced visualizer',
      'Unlimited playlists'
    ],
    pricing: {
      monthly: {
        priceId: STRIPE_PRODUCTS.premium.monthly.priceId,
        amount: STRIPE_PRODUCTS.premium.monthly.price,
        currency: STRIPE_PRODUCTS.premium.monthly.currency,
        interval: 'month',
        intervalCount: 1,
      },
      yearly: {
        priceId: STRIPE_PRODUCTS.premium.yearly.priceId,
        amount: STRIPE_PRODUCTS.premium.yearly.price,
        currency: STRIPE_PRODUCTS.premium.yearly.currency,
        interval: 'year',
        intervalCount: 1,
        discountPercentage: 17,
        originalAmount: 119.88,
      },
    },
    popular: true,
    trialDays: 7,
  },
  {
    id: 'student',
    tier: 'student',
    name: 'Premium Student',
    description: 'Premium for students at 50% off',
    features: [
      'All Premium features',
      '50% off student discount',
      'Student verification required',
      'Valid student ID needed',
      'Annual verification'
    ],
    pricing: {
      monthly: {
        priceId: STRIPE_PRODUCTS.student.monthly.priceId,
        amount: STRIPE_PRODUCTS.student.monthly.price,
        currency: STRIPE_PRODUCTS.student.monthly.currency,
        interval: 'month',
        intervalCount: 1,
        discountPercentage: 50,
        originalAmount: 9.99,
      },
    },
    studentEligible: true,
    trialDays: 7,
  },
  {
    id: 'family',
    tier: 'family',
    name: 'Premium Family',
    description: 'Premium for up to 6 accounts',
    features: [
      'All Premium features',
      'Up to 6 family accounts',
      'Individual profiles',
      'Family mix playlist',
      'Parental controls',
      'Shared family playlists',
      'Individual music libraries'
    ],
    pricing: {
      monthly: {
        priceId: STRIPE_PRODUCTS.family.monthly.priceId,
        amount: STRIPE_PRODUCTS.family.monthly.price,
        currency: STRIPE_PRODUCTS.family.monthly.currency,
        interval: 'month',
        intervalCount: 1,
      },
      yearly: {
        priceId: STRIPE_PRODUCTS.family.yearly.priceId,
        amount: STRIPE_PRODUCTS.family.yearly.price,
        currency: STRIPE_PRODUCTS.family.yearly.currency,
        interval: 'year',
        intervalCount: 1,
        discountPercentage: 17,
        originalAmount: 179.88,
      },
    },
    trialDays: 7,
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Johnson',
    role: 'Music Enthusiast',
    content: 'The sound quality is incredible! I can finally hear every detail in my favorite songs.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Student',
    content: 'The student discount makes it super affordable. Perfect for my tight budget.',
    rating: 5,
  },
  {
    name: 'Emma Williams',
    role: 'Family of 5',
    content: 'Family plan is amazing value. Everyone gets their own music while sharing favorites.',
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access to premium features until the end of your current billing period.',
  },
  {
    question: 'What happens after my free trial ends?',
    answer: 'After your 7-day free trial, you\'ll be automatically charged for your chosen plan unless you cancel before the trial ends.',
  },
  {
    question: 'Can I change my plan later?',
    answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.',
  },
  {
    question: 'Is the student discount really 50% off?',
    answer: 'Yes! Students get Premium for just $4.99/month with valid student verification. You\'ll need to reverify annually.',
  },
  {
    question: 'How does the family plan work?',
    answer: 'The family plan allows up to 6 family members to have their own Premium accounts under one subscription, each with individual libraries and recommendations.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers. Payment is processed securely through Stripe.',
  },
];

export function PricingPage({ onSelectPlan, currentTier = 'free' }: PricingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === 'free') return;
    onSelectPlan(tier, billingPeriod);
  };

  const getButtonText = (plan: SubscriptionPlan) => {
    if (plan.tier === 'free') {
      return currentTier === 'free' ? 'Current Plan' : 'Downgrade to Free';
    }
    if (currentTier === plan.tier) {
      return 'Current Plan';
    }
    return currentTier === 'free' ? 'Start Free Trial' : 'Switch Plan';
  };

  const getButtonVariant = (plan: SubscriptionPlan) => {
    if (plan.tier === 'free' || currentTier === plan.tier) {
      return 'outline';
    }
    return plan.popular ? 'default' : 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              Choose Your Music Experience
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl"
            >
              From free music with ads to premium high-quality streaming. 
              Find the perfect plan for your listening needs.
            </motion.p>
          </div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-12 flex max-w-xs items-center justify-center rounded-lg bg-gray-100 p-1"
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600 font-semibold">Save 17%</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {SUBSCRIPTION_PLANS.map((plan, index) => {
              const pricing = billingPeriod === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
              const isPopular = plan.popular;
              const isCurrent = currentTier === plan.tier;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className={cn(
                    'relative rounded-2xl border p-8 shadow-sm',
                    isPopular 
                      ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 bg-white',
                    isCurrent && 'ring-2 ring-green-200 border-green-200'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                        <StarIcon className="h-4 w-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white">
                        <CheckIcon className="h-4 w-4" />
                        Current Plan
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                    
                    {pricing ? (
                      <div className="mt-6">
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900">
                            {formatPrice(pricing.amount)}
                          </span>
                          <span className="ml-1 text-lg text-gray-600">
                            /{pricing.interval}
                          </span>
                        </div>
                        {pricing.originalAmount && (
                          <div className="mt-1">
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(pricing.originalAmount)}
                            </span>
                            <span className="ml-2 text-sm font-medium text-green-600">
                              Save {pricing.discountPercentage}%
                            </span>
                          </div>
                        )}
                        {plan.trialDays > 0 && (
                          <p className="mt-2 text-sm text-gray-600">
                            {plan.trialDays}-day free trial
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-6">
                        <span className="text-4xl font-bold text-gray-900">Free</span>
                      </div>
                    )}
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                        <span className="ml-3 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.tier)}
                    onMouseEnter={() => plan.tier !== 'free' && preloadStripe()}
                    onFocus={() => plan.tier !== 'free' && preloadStripe()}
                    variant={getButtonVariant(plan)}
                    className="w-full"
                    disabled={currentTier === plan.tier}
                  >
                    {getButtonText(plan)}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Loved by music fans worldwide</h2>
            <p className="mt-4 text-lg text-gray-600">
              See what our users have to say about their premium experience
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <p className="font-medium text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to know about our subscriptions
            </p>
          </div>
          
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 * index }}
                className="rounded-lg border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-medium text-gray-900">{item.question}</span>
                  <motion.div
                    animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: expandedFaq === index ? 'auto' : 0,
                    opacity: expandedFaq === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-blue-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to upgrade your music experience?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Start your free trial today and discover why millions choose Premium
          </p>
          <div className="mt-8">
            <Button
              onClick={() => handleSelectPlan('premium')}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-gray-50"
              disabled={currentTier === 'premium'}
            >
              {currentTier === 'premium' ? 'You\'re Premium!' : 'Start Free Trial'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}