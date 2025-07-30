/**
 * Monitoring Dashboard Component
 * Displays real-time monitoring metrics and statistics
 */

'use client';

import { useState, useEffect } from 'react';
import { webVitalsMonitor } from '@/lib/monitoring/web-vitals';
import { errorMonitor } from '@/lib/monitoring/error-monitoring';
import { clientLogger } from '@/lib/client-logger';

// Removed unused interface MetricCard

export function MonitoringDashboard() {
  const [webVitals, setWebVitals] = useState<Record<string, {
    value: number;
    rating?: 'good' | 'needs-improvement' | 'poor';
  }>>({});
  const [errorStats, setErrorStats] = useState<Record<string, {
    total?: number;
    topErrors?: Array<{ key: string; count: number }>;
  }>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      // Get Web Vitals summary
      const vitals = webVitalsMonitor.getMetricsSummary();
      setWebVitals(vitals);

      // Get error statistics
      const errors = errorMonitor.getErrorStats();
      setErrorStats(errors);
    };

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    clientLogger.info('Monitoring dashboard toggled', { visible: !isVisible });
  };

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'ms') {
      return value > 1000 ? `${(value / 1000).toFixed(2)}s` : `${value}ms`;
    }
    return `${value}${unit || ''}`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 z-50"
        aria-label="Show monitoring dashboard"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Monitoring Dashboard
        </h3>
        <button
          onClick={toggleVisibility}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close monitoring dashboard"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[500px] p-4 space-y-4">
        {/* Web Vitals Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Web Vitals
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(webVitals).map(([metric, data]) => (
              <div
                key={metric}
                className={`p-3 rounded-lg ${getRatingColor(data.rating)}`}
              >
                <div className="text-xs font-medium opacity-75">{metric}</div>
                <div className="text-lg font-semibold">
                  {formatValue(data.value, metric === 'CLS' ? '' : 'ms')}
                </div>
                {data.rating && (
                  <div className="text-xs mt-1 capitalize">{data.rating}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Statistics Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Error Statistics
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Errors</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {Object.values(errorStats)[0]?.total || 0}
              </span>
            </div>
            
            {Object.values(errorStats)[0]?.topErrors && Object.values(errorStats)[0]!.topErrors!.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Top Errors</div>
                {Object.values(errorStats)[0]!.topErrors!.slice(0, 3).map((error, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded mb-1"
                  >
                    <div className="font-medium text-red-800 dark:text-red-300">
                      {error.key.split('-').slice(0, 2).join(' ')}
                    </div>
                    <div className="text-red-600 dark:text-red-400">
                      Count: {error.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Performance Insights
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>Page Load: {performance.timing ? `${performance.timing.loadEventEnd - performance.timing.navigationStart}ms` : 'N/A'}</div>
            <div>DOM Interactive: {performance.timing ? `${performance.timing.domInteractive - performance.timing.navigationStart}ms` : 'N/A'}</div>
            <div>Memory: {(performance as Performance & { memory?: { usedJSHeapSize: number } }).memory ? `${Math.round((performance as Performance & { memory?: { usedJSHeapSize: number } }).memory!.usedJSHeapSize / 1048576)}MB` : 'N/A'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              errorMonitor.clearErrorStats();
              setErrorStats({});
              clientLogger.info('Error statistics cleared');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear Error Stats
          </button>
        </div>
      </div>
    </div>
  );
}

// Development-only monitoring toolbar
export function DevelopmentMonitoringToolbar() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <MonitoringDashboard />;
}