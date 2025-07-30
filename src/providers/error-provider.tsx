'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { parseError, ClientError } from '@/lib/client-error-handler';

interface ErrorContextType {
  errors: Map<string, ClientError>;
  addError: (key: string, error: unknown) => void;
  removeError: (key: string) => void;
  clearErrors: () => void;
  hasError: (key: string) => boolean;
  getError: (key: string) => ClientError | undefined;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  onError?: (error: ClientError, key: string) => void;
}

export function ErrorProvider({ children, onError }: ErrorProviderProps) {
  const [errors, setErrors] = useState<Map<string, ClientError>>(new Map());

  const addError = useCallback((key: string, error: unknown) => {
    const clientError = parseError(error);
    
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.set(key, clientError);
      return newErrors;
    });

    // Call onError callback if provided
    if (onError) {
      onError(clientError, key);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error [${key}]:`, clientError);
    }
  }, [onError]);

  const removeError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(key);
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors(new Map());
  }, []);

  const hasError = useCallback((key: string) => {
    return errors.has(key);
  }, [errors]);

  const getError = useCallback((key: string) => {
    return errors.get(key);
  }, [errors]);

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    hasError,
    getError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
}

/**
 * Hook for managing errors in a specific component or feature
 */
export function useError(key: string) {
  const { addError, removeError, hasError, getError } = useErrorContext();

  const setError = useCallback((error: unknown) => {
    addError(key, error);
  }, [key, addError]);

  const clearError = useCallback(() => {
    removeError(key);
  }, [key, removeError]);

  return {
    error: getError(key),
    hasError: hasError(key),
    setError,
    clearError,
  };
}