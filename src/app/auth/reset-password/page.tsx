import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
  title: 'Reset Password | Spotify',
  description: 'Create a new password for your Spotify account.',
};

function ResetPasswordPageContent() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter a new secure password for your account"
      showBackLink={true}
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Reset your password">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </AuthLayout>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}