/**
 * Server-side instrumentation for performance monitoring
 */

import { logger } from '../logger';

// Track server startup time
const serverStartTime = Date.now();

// Initialize server monitoring
export function initServerMonitoring() {
  logger.info('Server instrumentation initialized', {
    startupTime: Date.now() - serverStartTime,
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
  });

  // Monitor process metrics
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      logger.info('Server metrics', {
        metrics: {
          memory: {
            rss: Math.round(memoryUsage.rss / 1048576), // MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1048576),
            heapTotal: Math.round(memoryUsage.heapTotal / 1048576),
            external: Math.round(memoryUsage.external / 1048576),
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          uptime: process.uptime(),
        },
      });
    }, 60000); // Every minute
  }
}

// Initialize on import
initServerMonitoring();