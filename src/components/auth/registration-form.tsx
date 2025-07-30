'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrengthIndicator } from './password-strength';
import { registrationSchema, type RegistrationFormData } from '@/lib/auth/validation';

interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export function RegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setError: setFieldError,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create user account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiError = await response.json();

      if (!response.ok || !result.success) {
        if (result.errors) {
          // Handle field-specific errors
          Object.entries(result.errors).forEach(([field, messages]) => {
            setFieldError(field as keyof RegistrationFormData, {
              type: 'server',
              message: messages[0],
            });
          });
        } else {
          setError(result.message || 'Registration failed');
        }
        return;
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/');
        router.refresh();
      } else {
        // Registration succeeded but login failed - redirect to login page
        router.push('/auth/login?message=Registration successful. Please log in.');
      }

    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Global Error */}
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
        placeholder="Enter your email"
        error={errors.email?.message}
        autoComplete="email"
        autoFocus
        aria-describedby={errors.email ? 'email-error' : undefined}
      />

      {/* Username Field */}
      <Input
        {...register('username')}
        type="text"
        label="Username"
        placeholder="Choose a username"
        error={errors.username?.message}
        autoComplete="username"
        aria-describedby={errors.username ? 'username-error' : undefined}
      />

      {/* Display Name Field */}
      <Input
        {...register('displayName')}
        type="text"
        label="Display name"
        placeholder="How should we call you?"
        error={errors.displayName?.message}
        autoComplete="name"
        aria-describedby={errors.displayName ? 'displayName-error' : undefined}
      />

      {/* Password Field */}
      <div className="space-y-3">
        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            autoComplete="new-password"
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
          label="Confirm password"
          placeholder="Confirm your password"
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
        {isLoading ? 'Creating account...' : 'Sign up'}
      </Button>

      {/* Form Validation Status - Screen Reader Only */}
      {!isValid && (
        <div id="form-validation-status" className="sr-only" role="status" aria-live="polite">
          Form has validation errors. Please check the fields above.
        </div>
      )}

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}