'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Global error:', error);
    
    // In production, send to error tracking service
    if (!isDevelopment && error.digest) {
      // Example: sendToErrorTracking(error);
    }
  }, [error, isDevelopment]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-black to-black flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Error Card */}
        <div className="bg-neutral-900/50 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-neutral-800">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/10 rounded-full animate-pulse">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-neutral-400 text-lg">
              We encountered an unexpected error while processing your request
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {isDevelopment && (
            <div className="mb-8">
              <details className="group">
                <summary className="cursor-pointer flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
                  <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  Technical Details
                </summary>
                <div className="mt-4 space-y-3">
                  <div className="bg-black/50 rounded-lg p-4 border border-neutral-800">
                    <p className="text-xs font-semibold text-red-400 mb-1">Error Message:</p>
                    <p className="text-sm text-neutral-300 font-mono break-all">
                      {error.message || 'No error message available'}
                    </p>
                  </div>
                  {error.digest && (
                    <div className="bg-black/50 rounded-lg p-4 border border-neutral-800">
                      <p className="text-xs font-semibold text-red-400 mb-1">Error ID:</p>
                      <p className="text-sm text-neutral-300 font-mono">{error.digest}</p>
                    </div>
                  )}
                  {error.stack && (
                    <div className="bg-black/50 rounded-lg p-4 border border-neutral-800">
                      <p className="text-xs font-semibold text-red-400 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-neutral-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={reset}
              variant="outline"
              className="flex-1 border-neutral-700 hover:border-neutral-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Error ID for Production */}
          {!isDevelopment && error.digest && (
            <div className="mt-6 text-center">
              <p className="text-xs text-neutral-500">
                Error ID: <span className="font-mono text-neutral-400">{error.digest}</span>
              </p>
            </div>
          )}

          {/* Support Information */}
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <p className="text-sm text-center text-neutral-500">
              If this problem continues, please contact our{' '}
              <a href="/support" className="text-green-500 hover:text-green-400 underline">
                support team
              </a>
            </p>
          </div>
        </div>

        {/* Additional Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            You can also try clearing your browser cache or using a different browser
          </p>
        </div>
      </div>
    </div>
  );
}