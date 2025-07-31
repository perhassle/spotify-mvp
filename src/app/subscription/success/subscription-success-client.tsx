'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircleIcon, StarIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser: _updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const subscriptionId = searchParams.get('subscription');

  useEffect(() => {
    // Set loading to false after component mounts
    setIsLoading(false);
  }, []);

  const handleContinue = () => {
    router.push('/');
  };

  const handleManageSubscription = () => {
    router.push('/subscription/manage');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Premium!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Your subscription is now active and your free trial has started.
            </p>
            <p className="text-sm text-gray-500">
              {subscriptionId && `Subscription ID: ${subscriptionId.slice(0, 20)}...`}
            </p>
          </motion.div>

          {/* Premium Features Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-lg p-6 shadow-sm border mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              You now have access to:
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <MusicalNoteIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Ad-free music streaming</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Unlimited skips</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">High-quality audio (320kbps)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Offline downloads</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Advanced equalizer</span>
              </div>
            </div>
          </motion.div>

          {/* Trial Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-blue-50 rounded-lg p-4 mb-8 text-left"
          >
            <h4 className="font-semibold text-blue-900 mb-2">7-Day Free Trial</h4>
            <p className="text-sm text-blue-700">
              Your trial is active until{' '}
              {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              You can cancel anytime before then without being charged.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-4"
          >
            <Button onClick={handleContinue} className="w-full">
              Start Listening
            </Button>
            <Button 
              onClick={handleManageSubscription} 
              variant="outline" 
              className="w-full"
            >
              Manage Subscription
            </Button>
          </motion.div>

          {/* Email Confirmation Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8 text-xs text-gray-500"
          >
            <p>
              A confirmation email has been sent to {user?.email}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}