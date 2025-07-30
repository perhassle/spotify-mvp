// Toast function type that will be injected
type ToastFunction = (message: string, description?: string) => void;

// Client-side error types
export interface ClientError {
  message: string;
  type?: string;
  statusCode?: number;
  details?: any;
  requestId?: string;
}

// API response error structure
interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
    statusCode: number;
    timestamp: string;
    requestId: string;
    details?: any;
  };
}

// Parse error from various sources
export function parseError(error: unknown): ClientError {
  // Handle fetch response errors
  if (error instanceof Response) {
    return {
      message: error.statusText || 'Network error occurred',
      statusCode: error.status,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Handle API error responses
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;
    
    // Check if it's our API error format
    if (apiError.error && typeof apiError.error === 'object') {
      const { message, type, statusCode, details, requestId } = apiError.error;
      return {
        message,
        type,
        statusCode,
        details,
        requestId,
      };
    }

    // Check for message property
    if (apiError.message) {
      return {
        message: apiError.message,
        statusCode: apiError.statusCode,
      };
    }
  }

  // Default error
  return {
    message: 'An unexpected error occurred',
  };
}

// User-friendly error messages
const ERROR_MESSAGES: Record<number, string> = {
  400: 'The request contains invalid data. Please check your input.',
  401: 'You need to be logged in to perform this action.',
  403: 'You don\'t have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  429: 'Too many requests. Please slow down.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service is currently under maintenance.',
};

// Get user-friendly error message
export function getUserFriendlyMessage(error: ClientError): string {
  // Use custom message if it's already user-friendly
  if (error.message && !error.message.includes('Error:') && error.message.length < 100) {
    return error.message;
  }

  // Use status code mapping
  if (error.statusCode && ERROR_MESSAGES[error.statusCode]) {
    return ERROR_MESSAGES[error.statusCode] ?? 'An unexpected error occurred. Please try again.';
  }

  // Fallback messages based on error type
  if (error.type) {
    switch (error.type) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'AUTHENTICATION_ERROR':
        return 'Authentication failed. Please log in again.';
      case 'AUTHORIZATION_ERROR':
        return 'You don\'t have permission to perform this action.';
      case 'PAYMENT_ERROR':
        return 'Payment processing failed. Please check your payment details.';
      case 'RATE_LIMIT_ERROR':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

// Global toast function - will be set by the app
let globalToastError: ToastFunction | null = null;

// Set the global toast function
export function setGlobalToastError(toastFn: ToastFunction) {
  globalToastError = toastFn;
}

// Display error with toast notification
export function showError(error: unknown, customMessage?: string) {
  const parsedError = parseError(error);
  const message = customMessage || getUserFriendlyMessage(parsedError);
  const description = parsedError.requestId ? `Error ID: ${parsedError.requestId}` : undefined;

  // Show toast notification if available
  if (globalToastError) {
    globalToastError(message, description);
  } else {
    // Fallback to console
    console.error(message, description);
    
    // In development, show alert as fallback
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      alert(`Error: ${message}\n${description || ''}`);
    }
  }

  // Log detailed error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Client Error:', parsedError);
  }
}

// Handle form validation errors
export function getFieldErrors(error: ClientError): Record<string, string[]> | null {
  if (error.type === 'VALIDATION_ERROR' && error.details?.errors) {
    return error.details.errors;
  }
  return null;
}

// Retry configuration
interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

// Retry failed requests
export async function retryRequest<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = config;
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      const parsedError = parseError(error);
      if (parsedError.statusCode && parsedError.statusCode >= 400 && parsedError.statusCode < 500) {
        throw error;
      }
      
      // Wait before retrying
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

// Error recovery actions
export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
}

// Get recovery actions based on error type
export function getErrorRecoveryActions(error: ClientError): ErrorRecoveryAction[] {
  const actions: ErrorRecoveryAction[] = [];

  // Always add reload option
  actions.push({
    label: 'Reload Page',
    action: () => window.location.reload(),
  });

  // Add specific actions based on error
  if (error.statusCode === 401) {
    actions.push({
      label: 'Log In',
      action: () => { window.location.href = '/auth/login'; },
    });
  }

  if (error.type === 'PAYMENT_ERROR') {
    actions.push({
      label: 'Update Payment Method',
      action: () => { window.location.href = '/subscription/manage'; },
    });
  }

  return actions;
}

// Network error detection
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }
  
  const parsedError = parseError(error);
  return parsedError.statusCode === 0 || parsedError.message.toLowerCase().includes('network');
}

// Handle network errors specifically
export function handleNetworkError() {
  if (globalToastError) {
    globalToastError(
      'Network connection issue',
      'Please check your internet connection and try again.'
    );
  } else {
    console.error('Network connection issue');
  }
}

// Custom hook for error handling in React components
export function useErrorHandler() {
  return {
    showError,
    parseError,
    getUserFriendlyMessage,
    getFieldErrors,
    handleNetworkError,
    isNetworkError,
    retryRequest,
    getErrorRecoveryActions,
  };
}