import { AuthLayout } from '@/components/auth/auth-layout';
import { RegistrationForm } from '@/components/auth/registration-form';

export const metadata = {
  title: 'Sign Up | Spotify',
  description: 'Create a new Spotify account to start your music journey.',
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Join Spotify"
      subtitle="Create an account to start your music journey"
    >
      <RegistrationForm />
    </AuthLayout>
  );
}