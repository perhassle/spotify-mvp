import { useCallback, useEffect, useState } from 'react';
import { secureFetch } from '@/lib/security/csrf';
import { useRouter } from 'next/navigation';

interface SecureFetchOptions extends RequestInit {
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useSecureFetch() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWithRetry = useCallback(
    async (
      url: string,
      options: SecureFetchOptions = {},
      retryCount = 0
    ): Promise<Response> => {
      const maxRetries = options.retryCount || 3;
      const retryDelay = options.retryDelay || 1000;

      try {
        const response = await secureFetch(url, options);

        // Handle authentication errors
        if (response.status === 401) {
          router.push('/auth/login');
          throw new Error('Authentication required');
        }

        // Handle CSRF errors
        if (response.status === 403) {
          const data = await response.json();
          if (data.error?.includes('CSRF')) {
            // Refresh CSRF token and retry once
            await fetch('/api/csrf-token');
            return secureFetch(url, options);
          }
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retryCount + 1);
          }
        }

        return response;
      } catch (error) {
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
      }
    },
    [router]
  );

  const secureFetchJson = useCallback(
    async <T = any>(
      url: string,
      options: SecureFetchOptions = {}
    ): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchWithRetry(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        
        if (options.onError) {
          options.onError(error);
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithRetry]
  );

  const secureFetchText = useCallback(
    async (
      url: string,
      options: SecureFetchOptions = {}
    ): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchWithRetry(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        
        if (options.onError) {
          options.onError(error);
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithRetry]
  );

  const secureFetchBlob = useCallback(
    async (
      url: string,
      options: SecureFetchOptions = {}
    ): Promise<Blob> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchWithRetry(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.blob();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        
        if (options.onError) {
          options.onError(error);
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithRetry]
  );

  // Clear error on unmount
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  return {
    secureFetchJson,
    secureFetchText,
    secureFetchBlob,
    isLoading,
    error,
  };
}

// Type-safe API client
export function createSecureApiClient<T extends Record<string, any>>() {
  return {
    get: async <K extends keyof T>(
      endpoint: K,
      params?: Record<string, string>
    ): Promise<T[K]> => {
      const url = new URL(String(endpoint), window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      const response = await secureFetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    
    post: async <K extends keyof T>(
      endpoint: K,
      data: any
    ): Promise<T[K]> => {
      const response = await secureFetch(String(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    
    put: async <K extends keyof T>(
      endpoint: K,
      data: any
    ): Promise<T[K]> => {
      const response = await secureFetch(String(endpoint), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    
    delete: async <K extends keyof T>(
      endpoint: K
    ): Promise<void> => {
      const response = await secureFetch(String(endpoint), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    },
  };
}