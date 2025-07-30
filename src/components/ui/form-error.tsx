'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string;
  id?: string;
  className?: string;
  announcementLevel?: 'polite' | 'assertive';
}

export function FormError({ 
  message, 
  id, 
  className,
  announcementLevel = 'polite'
}: FormErrorProps) {
  const errorRef = useRef<HTMLDivElement>(null);
  const previousMessage = useRef<string | undefined>();

  useEffect(() => {
    // Only announce new errors, not when they clear
    if (message && message !== previousMessage.current) {
      // Focus management for screen readers
      if (errorRef.current) {
        // Briefly remove and re-add the message to ensure screen readers announce it
        errorRef.current.textContent = '';
        setTimeout(() => {
          if (errorRef.current) {
            errorRef.current.textContent = message;
          }
        }, 10);
      }
    }
    previousMessage.current = message;
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={errorRef}
      id={id}
      role="alert"
      aria-live={announcementLevel}
      aria-atomic="true"
      className={cn(
        "text-sm font-medium text-red-600 dark:text-red-400",
        "flex items-start gap-2 min-h-[20px]",
        className
      )}
    >
      <svg
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
    </svg>
      <span>{message}</span>
    </div>
  );
}

interface FormSuccessProps {
  message?: string;
  id?: string;
  className?: string;
}

export function FormSuccess({ message, id, className }: FormSuccessProps) {
  const successRef = useRef<HTMLDivElement>(null);
  const previousMessage = useRef<string | undefined>();

  useEffect(() => {
    if (message && message !== previousMessage.current) {
      if (successRef.current) {
        successRef.current.textContent = '';
        setTimeout(() => {
          if (successRef.current) {
            successRef.current.textContent = message;
          }
        }, 10);
      }
    }
    previousMessage.current = message;
  }, [message]);

  if (!message) return null;

  return (
    <div
      ref={successRef}
      id={id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "text-sm font-medium text-green-600 dark:text-green-400",
        "flex items-start gap-2 min-h-[20px]",
        className
      )}
    >
      <svg
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
    </svg>
      <span>{message}</span>
    </div>
  );
}