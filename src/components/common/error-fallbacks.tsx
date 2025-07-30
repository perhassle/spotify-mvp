'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  RefreshCw, 
  Home, 
  WifiOff, 
  ServerCrash,
  Lock,
  Search,
  Music
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

/**
 * Generic error fallback component
 */
export function GenericErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
          <p className="text-neutral-400">
            We encountered an error while loading this content
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <p className="text-xs text-neutral-500 font-mono mt-2">{error.message}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          {resetError && (
            <Button onClick={resetError} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button onClick={() => router.push('/')} size="sm">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Network error fallback
 */
export function NetworkErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-orange-500/10 rounded-full">
            <WifiOff className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">No internet connection</h2>
          <p className="text-neutral-400">
            Please check your network connection and try again
          </p>
        </div>
        {resetError && (
          <Button onClick={resetError} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Server error fallback
 */
export function ServerErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-full animate-pulse">
            <ServerCrash className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Server error</h2>
          <p className="text-neutral-400">
            Our servers are having issues. Please try again later
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          {resetError && (
            <Button onClick={resetError} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={() => window.location.href = '/'}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Authentication error fallback
 */
export function AuthErrorFallback() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-yellow-500/10 rounded-full">
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Authentication required</h2>
          <p className="text-neutral-400">
            Please log in to access this content
          </p>
        </div>
        <Button 
          onClick={() => router.push('/auth/login')}
          className="bg-green-600 hover:bg-green-700"
        >
          Log In
        </Button>
      </div>
    </div>
  );
}

/**
 * Not found error fallback
 */
export function NotFoundErrorFallback({ 
  title = "Content not found",
  message = "The content you're looking for doesn't exist or has been removed"
}: {
  title?: string;
  message?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-4 bg-neutral-800 rounded-full">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-neutral-400">{message}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            Go Back
          </Button>
          <Button 
            onClick={() => router.push('/')}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Player error fallback
 */
export function PlayerErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-500/10 rounded">
            <Music className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Playback error</p>
            <p className="text-xs text-neutral-400">Unable to play this track</p>
          </div>
        </div>
        {resetError && (
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Component error fallback (smaller, inline errors)
 */
export function ComponentErrorFallback({ 
  error, 
  resetError,
  message = "Failed to load this section"
}: ErrorFallbackProps & { message?: string }) {
  return (
    <div className="bg-neutral-900/50 rounded-lg p-6 border border-neutral-800">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-white">{message}</p>
          {process.env.NODE_ENV === 'development' && error && (
            <p className="text-xs text-neutral-500 font-mono">{error.message}</p>
          )}
          {resetError && (
            <Button onClick={resetError} variant="link" size="sm" className="p-0 h-auto">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}