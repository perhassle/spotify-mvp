'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { ErrorProvider } from '@/providers/error-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { MonitoringProvider } from '@/lib/monitoring/monitoring-provider';
import { ClientInitializer } from '@/components/common/client-initializer';
import { PerformanceMonitor } from '@/components/monitoring/performance-monitor';
import { DevelopmentMonitoringToolbar } from '@/components/monitoring/monitoring-dashboard';
import { AuthProvider } from '@/lib/auth/provider';
import { AppLayout } from '@/components/layout/app-layout';
import { handleErrorBoundaryError } from '@/lib/error-tracking';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary onError={handleErrorBoundaryError}>
      <ErrorProvider>
        <ToastProvider>
          <MonitoringProvider
            enableSentry={process.env.NODE_ENV === 'production'}
            enableWebVitals={true}
            enableErrorMonitoring={true}
          >
            <ClientInitializer />
            <PerformanceMonitor
              enableRUM={true}
              enableWebVitals={true}
              sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 1}
            />
            <AuthProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </AuthProvider>
            <DevelopmentMonitoringToolbar />
          </MonitoringProvider>
        </ToastProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}