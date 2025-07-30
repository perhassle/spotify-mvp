import { ApiError, ApiErrors } from './api-error-handler';
import { parseError, showError, retryRequest } from './client-error-handler';
import { errorTracker } from './error-tracking';
import React from 'react';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retry?: boolean | {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  };
  onError?: (error: unknown) => void;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  headers?: Headers;
}

/**
 * Base API client with error handling and retry logic
 */
class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private defaultTimeout: number;

  constructor(baseUrl = '', defaultHeaders: HeadersInit = {}, defaultTimeout = 30000) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(path, this.baseUrl || window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Create request with timeout
   */
  private async requestWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Parse API response
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorData;
      
      try {
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch {
        errorData = null;
      }
      
      // Check if it's our API error format
      if (errorData?.error) {
        const { message, type, statusCode, details, requestId } = errorData.error;
        throw new ApiError(message, statusCode || response.status, type, details);
      }
      
      // Create generic API error
      throw ApiErrors.internal(
        errorData?.message || response.statusText || 'Request failed',
        { status: response.status, data: errorData }
      );
    }
    
    // Parse successful response
    if (response.status === 204 || contentType?.includes('text/html')) {
      return { data: undefined as T, headers: response.headers };
    }
    
    const data = await response.json();
    return { data, headers: response.headers };
  }

  /**
   * Make API request
   */
  async request<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      params,
      timeout = this.defaultTimeout,
      retry = true,
      onError,
      headers,
      ...fetchOptions
    } = options;
    
    const url = this.buildUrl(path, params);
    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...headers,
      },
    };
    
    // Remove Content-Type for FormData
    if (fetchOptions.body instanceof FormData) {
      delete (requestOptions.headers as Record<string, string>)['Content-Type'];
    }
    
    const makeRequest = async () => {
      const response = await this.requestWithTimeout(url, requestOptions, timeout);
      return this.parseResponse<T>(response);
    };
    
    try {
      if (retry) {
        const retryConfig = typeof retry === 'object' ? retry : {};
        return await retryRequest(makeRequest, retryConfig);
      }
      
      return await makeRequest();
    } catch (error) {
      // Track error
      await errorTracker.trackWithContext(error, {
        url,
        method: fetchOptions.method || 'GET',
        retry,
      });
      
      // Call error handler
      if (onError) {
        onError(error);
      } else {
        showError(error);
      }
      
      return { error: error as ApiError };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    path: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    path: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: formData,
    });
  }
}

// Export default API client instance
export const apiClient = new ApiClient('/api');

// Export typed API client for different services
export const authApi = new ApiClient('/api/auth');
export const musicApi = new ApiClient('/api');
export const subscriptionApi = new ApiClient('/api/subscription');

/**
 * React hook for API requests with loading and error states
 */
export function useApiRequest<T = any>() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async (
    requestFn: () => Promise<ApiResponse<T>>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestFn();
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      setData(response.data || null);
      return response.data;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : ApiErrors.internal();
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}