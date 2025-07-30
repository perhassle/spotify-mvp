'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service in production
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTracking(error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ 
  error, 
  errorInfo 
}: { 
  error: Error | null; 
  errorInfo: React.ErrorInfo | null;
}) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-neutral-900 rounded-lg p-8 shadow-xl border border-neutral-800">
          {/* Error Icon and Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
              <p className="text-neutral-400 mt-1">
                An unexpected error occurred while loading this page
              </p>
            </div>
          </div>

          {/* Error Details (Development Only) */}
          {isDevelopment && error && (
            <div className="mb-6 space-y-4">
              <div className="bg-neutral-800 rounded-md p-4">
                <h3 className="text-sm font-semibold text-red-400 mb-2">Error Message:</h3>
                <p className="text-sm text-neutral-300 font-mono">{error.message}</p>
              </div>

              {error.stack && (
                <div className="bg-neutral-800 rounded-md p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Stack Trace:</h3>
                  <pre className="text-xs text-neutral-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo && (
                <div className="bg-neutral-800 rounded-md p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Component Stack:</h3>
                  <pre className="text-xs text-neutral-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleReload}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Support Message */}
          <p className="text-sm text-neutral-500 text-center mt-6">
            If this problem persists, please contact our support team
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}