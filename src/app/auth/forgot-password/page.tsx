import { AuthLayout } from '@/components/auth/auth-layout';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Forgot Password | Spotify',
  description: 'Reset your Spotify account password.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries, we'll help you reset it"
      showBackLink={true}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}