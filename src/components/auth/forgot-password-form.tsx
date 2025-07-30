'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/auth/validation';

interface ApiResponse {
  success: boolean;
  message: string;
  resetToken?: string; // Only in development
}

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Failed to send reset email');
        return;
      }

      setSuccess(result.message);
      
      // In development, show the reset token
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div 
          className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
          role="alert"
          aria-live="polite"
        >
          {success}
        </div>

        {/* Development Reset Link */}
        {resetToken && process.env.NODE_ENV === 'development' && (
          <div className="p-4 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
            <p className="font-medium mb-2">Development Mode:</p>
            <Link 
              href={`/auth/reset-password?token=${resetToken}`}
              className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Click here to reset your password
            </Link>
          </div>
        )}

        {/* Back to Login */}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Link href="/auth/login" className="flex items-center justify-center space-x-2">
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            <span>Back to Login</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Email Field */}
      <Input
        {...register('email')}
        type="email"
        label="Email address"
        placeholder="Enter your email address"
        error={errors.email?.message}
        autoComplete="email"
        autoFocus
        aria-describedby={errors.email ? 'email-error' : undefined}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="spotify"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send reset email'}
      </Button>

      {/* Back to Login */}
      <Button
        asChild
        variant="outline"
        size="lg"
        className="w-full"
      >
        <Link href="/auth/login" className="flex items-center justify-center space-x-2">
          <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
          <span>Back to Login</span>
        </Link>
      </Button>
    </form>
  );
}