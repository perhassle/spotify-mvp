'use client';

import { useEffect } from 'react';

/**
 * CSRF token provider component
 */
export function CsrfTokenProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch and set CSRF token on mount
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => {
        let meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'csrf-token';
          document.head.appendChild(meta);
        }
        meta.content = data.token;
      })
      .catch(console.error);
  }, []);
  
  return <>{children}</>;
}