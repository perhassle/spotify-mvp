import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SubscriptionTier, 
  SubscriptionStatus, 
  StripeSubscription,
  PaymentMethodDetails,
  Invoice,
  PromoCode
} from '@/types';

interface SubscriptionState {
  // Current subscription data
  subscription: StripeSubscription | null;
  paymentMethods: PaymentMethodDetails[];
  invoices: Invoice[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Checkout state
  checkoutLoading: boolean;
  appliedPromoCode: PromoCode | null;
  
  // Actions
  setSubscription: (subscription: StripeSubscription | null) => void;
  setPaymentMethods: (methods: PaymentMethodDetails[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCheckoutLoading: (loading: boolean) => void;
  setAppliedPromoCode: (promo: PromoCode | null) => void;
  
  // Async actions
  loadSubscriptionData: () => Promise<void>;
  cancelSubscription: (subscriptionId: string, immediate?: boolean) => Promise<void>;
  reactivateSubscription: (subscriptionId: string) => Promise<void>;
  changePlan: (subscriptionId: string, newPriceId: string) => Promise<void>;
  updatePaymentMethod: (subscriptionId: string, paymentMethodId: string) => Promise<void>;
  applyPromoCode: (code: string, tier: SubscriptionTier, billing: 'monthly' | 'yearly') => Promise<PromoCode>;
  
  // Helper functions
  hasActiveSubscription: () => boolean;
  isTrialing: () => boolean;
  getTrialDaysRemaining: () => number;
  canCancelSubscription: () => boolean;
  getNextBillingDate: () => Date | null;
  getSubscriptionStatusMessage: () => string;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscription: null,
      paymentMethods: [],
      invoices: [],
      isLoading: false,
      error: null,
      checkoutLoading: false,
      appliedPromoCode: null,

      // Basic setters
      setSubscription: (subscription) => set({ subscription }),
      setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
      setInvoices: (invoices) => set({ invoices }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setCheckoutLoading: (checkoutLoading) => set({ checkoutLoading }),
      setAppliedPromoCode: (appliedPromoCode) => set({ appliedPromoCode }),

      // Load subscription data from API
      loadSubscriptionData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/subscription/manage');
          
          if (!response.ok) {
            throw new Error('Failed to load subscription data');
          }

          const data = await response.json();
          
          // Transform API data to our types
          const subscriptionData = data.subscriptions[0];
          const subscription: StripeSubscription | null = subscriptionData ? {
            id: subscriptionData.id,
            customerId: data.customer.id,
            status: subscriptionData.status as SubscriptionStatus,
            tier: subscriptionData.metadata.subscriptionTier as SubscriptionTier,
            priceId: subscriptionData.items[0]?.priceId || '',
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart * 1000),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd * 1000),
            ...(subscriptionData.trialStart && { trialStart: new Date(subscriptionData.trialStart * 1000) }),
            ...(subscriptionData.trialEnd && { trialEnd: new Date(subscriptionData.trialEnd * 1000) }),
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
            ...(subscriptionData.canceledAt && { canceledAt: new Date(subscriptionData.canceledAt * 1000) }),
            createdAt: new Date(),
            updatedAt: new Date(),
          } : null;

          const paymentMethods = data.paymentMethods.map((pm: any) => ({
            id: pm.id,
            type: pm.type,
            card: pm.card,
            billingDetails: pm.billingDetails,
            isDefault: true, // Assume first one is default for now
            createdAt: new Date(),
          }));

          const invoices = data.invoices.map((inv: any) => ({
            id: inv.id,
            subscriptionId: subscription?.id || '',
            customerId: data.customer.id,
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status,
            dueDate: new Date(inv.created * 1000),
            paidAt: inv.paidAt ? new Date(inv.paidAt * 1000) : undefined,
            description: `${subscription?.tier} subscription`,
            lineItems: [],
            tax: 0,
            total: inv.amount,
            createdAt: new Date(inv.created * 1000),
            updatedAt: new Date(inv.created * 1000),
          }));

          set({ 
            subscription,
            paymentMethods,
            invoices,
            isLoading: false 
          });

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load subscription data',
            isLoading: false 
          });
        }
      },

      // Cancel subscription
      cancelSubscription: async (subscriptionId: string, immediate = false) => {
        try {
          set({ isLoading: true, error: null });
          
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

          // Reload subscription data
          await get().loadSubscriptionData();

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to cancel subscription',
            isLoading: false 
          });
          throw error;
        }
      },

      // Reactivate subscription
      reactivateSubscription: async (subscriptionId: string) => {
        try {
          set({ isLoading: true, error: null });
          
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

          // Reload subscription data
          await get().loadSubscriptionData();

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
            isLoading: false 
          });
          throw error;
        }
      },

      // Change subscription plan
      changePlan: async (subscriptionId: string, newPriceId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/subscription/manage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId,
              action: 'change_plan',
              newPriceId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to change plan');
          }

          // Reload subscription data
          await get().loadSubscriptionData();

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to change plan',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update payment method
      updatePaymentMethod: async (subscriptionId: string, paymentMethodId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('/api/subscription/manage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId,
              action: 'update_payment_method',
              paymentMethodId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update payment method');
          }

          // Reload subscription data
          await get().loadSubscriptionData();

        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update payment method',
            isLoading: false 
          });
          throw error;
        }
      },

      // Apply promo code
      applyPromoCode: async (code: string, tier: SubscriptionTier, billing: 'monthly' | 'yearly') => {
        try {
          const response = await fetch('/api/subscription/promo-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, subscriptionTier: tier, billingPeriod: billing }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Invalid promo code');
          }

          const { promo } = await response.json();
          
          set({ appliedPromoCode: promo });
          return promo;

        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to apply promo code' });
          throw error;
        }
      },

      // Helper functions
      hasActiveSubscription: () => {
        const { subscription } = get();
        return Boolean(subscription && ['active', 'trialing'].includes(subscription.status));
      },

      isTrialing: () => {
        const { subscription } = get();
        return Boolean(subscription?.status === 'trialing' && 
                      subscription.trialEnd && 
                      new Date() < subscription.trialEnd);
      },

      getTrialDaysRemaining: () => {
        const { subscription } = get();
        if (!subscription?.trialEnd || subscription.status !== 'trialing') return 0;
        
        const now = new Date();
        const trialEnd = subscription.trialEnd;
        const diffTime = trialEnd.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      },

      canCancelSubscription: () => {
        const { subscription } = get();
        return Boolean(subscription && 
                      ['active', 'trialing'].includes(subscription.status) && 
                      !subscription.cancelAtPeriodEnd);
      },

      getNextBillingDate: () => {
        const { subscription } = get();
        return subscription?.currentPeriodEnd || null;
      },

      getSubscriptionStatusMessage: () => {
        const { subscription } = get();
        if (!subscription) return 'No active subscription';

        switch (subscription.status) {
          case 'active':
            if (subscription.cancelAtPeriodEnd) {
              return `Subscription canceling on ${subscription.currentPeriodEnd.toLocaleDateString()}`;
            }
            return `Active subscription - Next billing ${subscription.currentPeriodEnd.toLocaleDateString()}`;
          
          case 'trialing':
            const daysRemaining = get().getTrialDaysRemaining();
            return `Free trial - ${daysRemaining} days remaining`;
          
          case 'past_due':
            return 'Payment overdue - Please update payment method';
          
          case 'canceled':
            return 'Subscription canceled';
          
          case 'unpaid':
            return 'Payment required to continue service';
          
          case 'expired':
            return 'Subscription expired';
          
          default:
            return 'Subscription status unknown';
        }
      },
    }),
    {
      name: 'subscription-store',
      // Only persist basic data, not loading states
      partialize: (state) => ({
        subscription: state.subscription,
        paymentMethods: state.paymentMethods,
        invoices: state.invoices,
        appliedPromoCode: state.appliedPromoCode,
      }),
    }
  )
);