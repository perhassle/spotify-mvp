'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/stripe/config';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface SubscriptionData {
  customer: {
    id: string;
    email: string;
    name?: string;
    created: number;
  };
  subscriptions: Array<{
    id: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    trialStart?: number;
    trialEnd?: number;
    cancelAtPeriodEnd: boolean;
    canceledAt?: number;
    items: Array<{
      id: string;
      priceId: string;
      quantity: number;
      amount: number;
      currency: string;
      interval: string;
    }>;
    metadata: Record<string, string>;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    billingDetails: {
      name?: string;
      email?: string;
    };
  }>;
  invoices: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    created: number;
    paidAt?: number;
    hostedInvoiceUrl?: string;
    invoicePdf?: string;
  }>;
}

export function SubscriptionDashboard() {
  const { user } = useAuthStore();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription/manage');
      
      if (!response.ok) {
        throw new Error('Failed to load subscription data');
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, immediate = false) => {
    try {
      setActionLoading('cancel');
      
      const response = await fetch('/api/subscription/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          action: 'cancel',
          cancelAtPeriodEnd: !immediate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await loadSubscriptionData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setActionLoading('');
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      setActionLoading('reactivate');
      
      const response = await fetch('/api/subscription/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          action: 'reactivate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      await loadSubscriptionData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
    } finally {
      setActionLoading('');
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
          <ExclamationTriangleIcon className="h-3 w-3" />
          Canceling
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            <CheckCircleIcon className="h-3 w-3" />
            Active
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            <CalendarIcon className="h-3 w-3" />
            Trial
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Past Due
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            <XMarkIcon className="h-3 w-3" />
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getTierName = (metadata: Record<string, string>) => {
    const tier = metadata.subscriptionTier;
    switch (tier) {
      case 'premium': return 'Premium';
      case 'student': return 'Premium Student';
      case 'family': return 'Premium Family';
      default: return 'Premium';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view your subscription.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="rounded-full bg-red-100 p-3 mx-auto w-fit mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Subscription</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadSubscriptionData}>Try Again</Button>
      </div>
    );
  }

  if (!subscriptionData || subscriptionData.subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h2>
        <p className="text-gray-600 mb-4">You don't have any active subscriptions.</p>
        <Button onClick={() => window.location.href = '/pricing'}>
          View Plans
        </Button>
      </div>
    );
  }

  const activeSubscription = subscriptionData.subscriptions[0];
  const activeItem = activeSubscription?.items[0];

  if (!activeSubscription) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-600">You don't have an active subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Current Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
            <p className="text-gray-600">Manage your subscription and billing</p>
          </div>
          {getStatusBadge(activeSubscription.status, activeSubscription.cancelAtPeriodEnd)}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <p className="text-lg font-semibold text-gray-900">
                {getTierName(activeSubscription.metadata)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <p className="text-lg font-semibold text-gray-900">
                {activeItem ? `${formatPrice(activeItem.amount / 100, activeItem.currency)}/${activeItem.interval}` : 'N/A'}
              </p>
            </div>

            {activeSubscription.trialEnd && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trial Ends</label>
                <p className="text-gray-900">
                  {new Date(activeSubscription.trialEnd * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Billing Date</label>
              <p className="text-gray-900">
                {new Date(activeSubscription.currentPeriodEnd * 1000).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
              <p className="text-gray-900">
                {new Date(activeSubscription.currentPeriodStart * 1000).toLocaleDateString()} - {' '}
                {new Date(activeSubscription.currentPeriodEnd * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
          {activeSubscription.cancelAtPeriodEnd ? (
            <Button
              onClick={() => handleReactivateSubscription(activeSubscription.id)}
              disabled={actionLoading === 'reactivate'}
              className="flex items-center gap-2"
            >
              {actionLoading === 'reactivate' ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              Reactivate Subscription
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleCancelSubscription(activeSubscription.id)}
              disabled={actionLoading === 'cancel'}
              className="flex items-center gap-2"
            >
              {actionLoading === 'cancel' ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <XMarkIcon className="h-4 w-4" />
              )}
              Cancel Subscription
            </Button>
          )}

          <Button variant="outline" className="flex items-center gap-2">
            <CogIcon className="h-4 w-4" />
            Change Plan
          </Button>

          <Button variant="outline" className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4" />
            Update Payment
          </Button>
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        
        {subscriptionData.paymentMethods.length === 0 ? (
          <p className="text-gray-600">No payment methods on file.</p>
        ) : (
          <div className="space-y-3">
            {subscriptionData.paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    {pm.card && (
                      <>
                        <p className="font-medium text-gray-900">
                          {pm.card.brand.toUpperCase()} ****{pm.card.last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires {pm.card.expMonth}/{pm.card.expYear}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
        
        {subscriptionData.invoices.length === 0 ? (
          <p className="text-gray-600">No billing history available.</p>
        ) : (
          <div className="space-y-3">
            {subscriptionData.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatPrice(invoice.amount / 100, invoice.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(invoice.created * 1000).toLocaleDateString()}
                    {invoice.paidAt && ` • Paid ${new Date(invoice.paidAt * 1000).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    invoice.status === 'paid' 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  )}>
                    {invoice.status}
                  </span>
                  {invoice.hostedInvoiceUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3" />
                      View
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}