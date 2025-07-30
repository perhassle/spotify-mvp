/**
 * Next.js Instrumentation file
 * Used for performance monitoring and metrics collection
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    await import('./lib/monitoring/server-instrumentation');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    await import('./lib/monitoring/edge-instrumentation');
  }
}