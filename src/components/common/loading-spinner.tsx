'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-neutral-700 border-t-green-500`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export function FullPageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-neutral-400 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export function ComponentLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" />
    </div>
  );
}