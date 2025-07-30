'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/lib/client-error-handler';
import { ErrorBoundary } from './error-boundary';

// Example component showing how to use error handling
export function ErrorHandlingExample() {
  const [loading, setLoading] = useState(false);
  const errorHandler = useErrorHandler();

  // Example: API call with error handling
  const handleApiCall = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/some-endpoint');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      
      const data = await response.json();
      console.log('Success:', data);
      
    } catch (error) {
      // Use the error handler to show user-friendly message
      errorHandler.showError(error);
      
      // Get field errors for form validation
      const fieldErrors = errorHandler.getFieldErrors(errorHandler.parseError(error));
      if (fieldErrors) {
        console.log('Validation errors:', fieldErrors);
      }
      
    } finally {
      setLoading(false);
    }
  };

  // Example: Network error handling with retry
  const handleNetworkRequest = async () => {
    try {
      const data = await errorHandler.retryRequest(
        async () => {
          const response = await fetch('/api/data');
          if (!response.ok) throw new Error('Request failed');
          return response.json();
        },
        { maxAttempts: 3, delay: 1000 }
      );
      
      console.log('Data:', data);
      
    } catch (error) {
      if (errorHandler.isNetworkError(error)) {
        errorHandler.handleNetworkError();
      } else {
        errorHandler.showError(error);
      }
    }
  };

  // Example: Throwing error to test error boundary
  const triggerError = () => {
    throw new Error('Test error boundary!');
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Error Handling Examples</h2>
      
      <div className="space-y-2">
        <Button 
          onClick={handleApiCall} 
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Test API Error'}
        </Button>
        
        <Button 
          onClick={handleNetworkRequest}
          variant="outline"
        >
          Test Network Error with Retry
        </Button>
        
        <Button 
          onClick={triggerError}
          variant="destructive"
        >
          Test Error Boundary
        </Button>
      </div>
    </div>
  );
}

// Example of using ErrorBoundary with custom fallback
export function ErrorHandlingWithCustomFallback() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">Custom Error Fallback</h3>
          <p className="text-red-600">Something went wrong in this section.</p>
        </div>
      }
    >
      <ErrorHandlingExample />
    </ErrorBoundary>
  );
}