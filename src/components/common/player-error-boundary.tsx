'use client';

import React from 'react';
import { ErrorBoundaryWithFallback } from './error-boundary-with-fallback';

interface PlayerErrorBoundaryProps {
  children: React.ReactNode;
}

export function PlayerErrorBoundary({ children }: PlayerErrorBoundaryProps) {
  return (
    <ErrorBoundaryWithFallback
      fallback={
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          <p className="text-sm font-medium">Player unavailable. Please refresh to restore playback.</p>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log player-specific errors
        console.error('Player Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundaryWithFallback>
  );
}