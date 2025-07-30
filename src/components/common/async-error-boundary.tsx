'use client';

import React, { Component, ReactNode, Suspense } from 'react';
import { ErrorBoundary } from './error-boundary';
import { LoadingSpinner } from './loading-spinner';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Combines Error Boundary with Suspense for handling both async loading and errors
 */
export function AsyncErrorBoundary({
  children,
  fallback,
  loadingFallback,
  onError,
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Suspense fallback={loadingFallback || <LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

interface AsyncBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based async error boundary with retry capability
 */
export class AsyncBoundaryWithRetry extends Component<
  AsyncErrorBoundaryProps & { maxRetries?: number },
  AsyncBoundaryState & { retryCount: number }
> {
  constructor(props: AsyncErrorBoundaryProps & { maxRetries?: number }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props;
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('AsyncErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: retryCount + 1,
      });
    }
  };

  override render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, loadingFallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default retry UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
          <div className="text-center space-y-4">
            <p className="text-red-500 font-medium">Something went wrong</p>
            <p className="text-neutral-400 text-sm">{error.message}</p>
            {retryCount < maxRetries && (
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                Retry ({maxRetries - retryCount} attempts left)
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={loadingFallback || <LoadingSpinner />}>
        {children}
      </Suspense>
    );
  }
}

/**
 * Hook for handling async errors in components
 */
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}