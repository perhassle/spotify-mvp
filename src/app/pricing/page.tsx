'use client';

import { useRouter } from 'next/navigation';
import { PricingPage } from '@/components/subscription/pricing-page';
import { SubscriptionTier } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

export default function PricingPageRoute() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleSelectPlan = (tier: SubscriptionTier, billing: 'monthly' | 'yearly') => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/auth/login?redirect=/subscribe/${tier}?billing=${billing}`);
      return;
    }

    // Redirect to subscription checkout
    router.push(`/subscribe/${tier}?billing=${billing}`);
  };

  return (
    <div className="min-h-screen">
      <PricingPage 
        onSelectPlan={handleSelectPlan}
        currentTier={user?.subscriptionTier}
      />
    </div>
  );
}