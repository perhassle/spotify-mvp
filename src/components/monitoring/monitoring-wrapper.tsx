'use client';

import dynamic from 'next/dynamic';

// Lazy load heavy monitoring components in a client component
const MonitoringProvider = dynamic(
  () => import('@/lib/monitoring/monitoring-provider').then((mod) => ({ 
    default: mod.MonitoringProvider 
  })),
  { ssr: false }
);

const PerformanceMonitor = dynamic(
  () => import('@/components/monitoring/performance-monitor').then((mod) => ({ 
    default: mod.PerformanceMonitor 
  })),
  { ssr: false }
);

const DevelopmentMonitoringToolbar = dynamic(
  () => import('@/components/monitoring/monitoring-dashboard').then((mod) => ({ 
    default: mod.DevelopmentMonitoringToolbar 
  })),
  { ssr: false }
);

interface MonitoringWrapperProps {
  children: React.ReactNode;
}

export function MonitoringWrapper({ children }: MonitoringWrapperProps) {
  return (
    <MonitoringProvider
      enableSentry={process.env.NODE_ENV === 'production'}
      enableWebVitals={true}
      enableErrorMonitoring={true}
    >
      <PerformanceMonitor
        enableRUM={true}
        enableWebVitals={true}
        _sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 1}
      />
      {children}
      <DevelopmentMonitoringToolbar />
    </MonitoringProvider>
  );
}