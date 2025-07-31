'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError, FormSuccess } from '@/components/ui/form-error';
import { loginSchema, type LoginFormData } from '@/lib/auth/validation';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get redirect URL and success message from query params
  const redirectTo = searchParams.get('from') || '/home';
  const successMessage = searchParams.get('message');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Show success message if present
  useEffect(() => {
    if (successMessage) {
      // You could show a toast notification here instead
      setError(null);
    }
  }, [successMessage]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Invalid email or password. Please try again.');
            break;
          case 'Configuration':
            setError('Authentication configuration error. Please contact support.');
            break;
          default:
            setError('Login failed. Please try again.');
        }
        return;
      }

      if (result?.ok) {
        // Successful login
        router.push(redirectTo);
        router.refresh();
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Success Message */}
      {successMessage && (
        <FormSuccess 
          message={successMessage}
          id="login-success"
          className="p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800"
        />
      )}

      {/* Error Message */}
      <FormError 
        message={error || undefined}
        id="login-error"
        announcementLevel="assertive"
        className="p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800"
      />

      {/* Email Field */}
      <Input
        {...register('email')}
        type="email"
        label="Email address"
        placeholder="Enter your email"
        error={errors.email?.message}
        autoComplete="email"
        autoFocus
        required
        aria-describedby={[
          errors.email ? 'email-error' : null,
          error ? 'login-error' : null
        ].filter(Boolean).join(' ') || undefined}
      />

      {/* Password Field */}
      <div className="space-y-3">
        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            autoComplete="current-password"
            required
            aria-describedby={[
              errors.password ? 'password-error' : null,
              error ? 'login-error' : null,
              'password-toggle'
            ].filter(Boolean).join(' ') || undefined}
          />
          <button
            type="button"
            id="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] min-h-[44px] min-w-[44px] flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
            aria-label={showPassword ? 'Hide password text' : 'Show password text'}
            aria-pressed={showPassword}
          >
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
            <span aria-hidden="true">
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative min-h-[44px] min-w-[44px] flex items-center justify-center">
            <input
              {...register('rememberMe')}
              id="remember-me"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            Remember me for 30 days
          </label>
        </div>

        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="spotify"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?
          </span>
        </div>
      </div>

      {/* Registration Link */}
      <Button
        asChild
        variant="outline"
        size="lg"
        className="w-full"
      >
        <Link href="/auth/register">
          Create an account
        </Link>
      </Button>

      {/* Back to Home */}
      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded underline underline-offset-4"
        >
          ← Back to Home
        </Link>
      </div>
    </form>
  );
}