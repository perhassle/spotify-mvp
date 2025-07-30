'use client';

import { useState, useEffect } from 'react';

/**
 * Client-side hook for CSRF token management
 */
export function useCsrfToken(): {
  token: string | null;
  refreshToken: () => Promise<void>;
} {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Try to get token from meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) {
      setToken(metaToken);
      return;
    }
    
    // Fetch token from API
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setToken(data.token);
        }
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err);
      });
  }, []);
  
  const refreshToken = async () => {
    try {
      const res = await fetch('/api/csrf-token');
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      console.error('Failed to refresh CSRF token:', err);
    }
  };
  
  return { token, refreshToken };
}

/**
 * Secure fetch with automatic CSRF token inclusion
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get CSRF token from meta tag or cookie
  let csrfToken = null;
  
  // Try meta tag first
  if (typeof document !== 'undefined') {
    csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  }
  
  // If not in meta tag, try to get from API
  if (!csrfToken) {
    try {
      const tokenRes = await fetch('/api/csrf-token');
      const tokenData = await tokenRes.json();
      csrfToken = tokenData.token;
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
    }
  }
  
  // Include CSRF token in headers
  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'same-origin',
  });
}