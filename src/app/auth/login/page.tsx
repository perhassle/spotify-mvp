import { Suspense } from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Sign In | Spotify',
  description: 'Sign in to your Spotify account to access your music.',
};

function LoginPageContent() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue listening"
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Welcome back">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </AuthLayout>
    }>
      <LoginPageContent />
    </Suspense>
  );
}