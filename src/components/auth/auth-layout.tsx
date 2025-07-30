'use client';

import Link from 'next/link';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackLink?: boolean;
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackLink = false 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600">
      {/* Skip Navigation Links */}
      <nav className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
        <a 
          href="#main-content" 
          className="bg-white text-green-600 p-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-green-500"
        >
          Skip to main content
        </a>
      </nav>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      </div>

      <main 
        id="main-content"
        role="main"
        aria-label="Authentication"
        className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        {/* Logo */}
        <div className="w-full max-w-md">
          <Link 
            href="/" 
            className="mx-auto flex w-fit items-center space-x-2 text-white hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg p-2"
            aria-label="Go to homepage"
          >
            <MusicalNoteIcon className="h-8 w-8" aria-hidden="true" />
            <span className="text-2xl font-bold">Spotify</span>
          </Link>

          {/* Back Link */}
          {showBackLink && (
            <div className="mt-4 text-center">
              <Link 
                href="/"
                className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent rounded"
              >
                ← Back to Home
              </Link>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="mt-8 w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
            {/* Header */}
            <header className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </header>

            {/* Content */}
            <div>
              {children}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/70">
              By continuing, you agree to Spotify&apos;s{' '}
              <Link 
                href="/terms" 
                className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent rounded"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link 
                href="/privacy" 
                className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent rounded"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}