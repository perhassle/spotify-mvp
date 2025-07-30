'use client';

import React, { useEffect } from 'react';
import { useToast } from '@/providers/toast-provider';
import { setGlobalToastError } from '@/lib/client-error-handler';

export function ClientInitializer() {
  const toast = useToast();

  useEffect(() => {
    // Set up global toast error handler
    setGlobalToastError(toast.error);
  }, [toast.error]);

  return null;
}