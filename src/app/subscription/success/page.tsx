import type { Metadata } from "next";
import { Suspense } from "react";
import SubscriptionSuccessClient from "./subscription-success-client";

export const metadata: Metadata = {
  title: "Subscription Success - Spotify MVP",
  description: "Welcome to Spotify Premium! Your subscription is now active.",
};

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SubscriptionSuccessSkeleton />}>
      <SubscriptionSuccessClient />
    </Suspense>
  );
}

function SubscriptionSuccessSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-4 text-gray-600">Processing your subscription...</p>
      </div>
    </div>
  );
}