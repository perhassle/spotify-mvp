'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrengthIndicator } from './password-strength';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/auth/validation';

interface ApiResponse {
  success: boolean;
  message: string;
}

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  // Set token from URL params
  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || 'Failed to reset password');
        return;
      }

      setSuccess(result.message);
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push('/auth/login?message=Password reset successful. Please log in with your new password.');
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
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

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Redirecting you to the login page...
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-6">
        {/* Error Message */}
        <div 
          className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          Invalid reset link. Please request a new password reset.
        </div>

        {/* Request New Reset */}
        <Button
          asChild
          variant="spotify"
          size="lg"
          className="w-full"
        >
          <Link href="/auth/forgot-password">
            Request password reset
          </Link>
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Instructions */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Enter your new password below.
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

      {/* Hidden Token Field */}
      <input {...register('token')} type="hidden" />

      {/* Password Field */}
      <div className="space-y-3">
        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="New password"
            placeholder="Enter your new password"
            error={errors.password?.message}
            autoComplete="new-password"
            autoFocus
            aria-describedby={errors.password ? 'password-error' : 'password-strength'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Password Strength Indicator */}
        <div id="password-strength">
          <PasswordStrengthIndicator password={passwordValue} />
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="relative">
        <Input
          {...register('confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm new password"
          placeholder="Confirm your new password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-[34px] text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          {showConfirmPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="spotify"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
        aria-describedby={!isValid ? 'form-validation-status' : undefined}
      >
        {isLoading ? 'Resetting password...' : 'Reset password'}
      </Button>

      {/* Form Validation Status - Screen Reader Only */}
      {!isValid && (
        <div id="form-validation-status" className="sr-only" role="status" aria-live="polite">
          Form has validation errors. Please check the fields above.
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
    </form>
  );
}