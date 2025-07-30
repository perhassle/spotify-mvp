import { SubscriptionDashboard } from '@/components/subscription/subscription-dashboard';

export default function SubscriptionManagePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your subscription, billing, and payment methods
          </p>
        </div>
        
        <SubscriptionDashboard />
      </div>
    </div>
  );
}