/**
 * Examples of using the structured logger in different scenarios
 */

import { logger, createLogger, withTiming } from './logger';

// Example 1: Basic logging in a service
export async function exampleMusicService() {
  const serviceLogger = createLogger({ 
    service: 'music-service',
    feature: 'recommendations' 
  });

  serviceLogger.info('Fetching user recommendations');
  
  try {
    // Simulate some async operation
    const recommendations = await withTiming(
      'fetch.recommendations',
      async () => {
        // Simulated API call
        await new Promise(resolve => setTimeout(resolve, 100));
        return ['song1', 'song2', 'song3'];
      },
      serviceLogger
    );

    serviceLogger.info('Recommendations fetched successfully', {
      count: recommendations.length
    });

    return recommendations;
  } catch (error) {
    serviceLogger.error('Failed to fetch recommendations', error as Error);
    throw error;
  }
}

// Example 2: Using logger in a React Server Component
export async function ServerComponentExample({ userId }: { userId: string }) {
  const componentLogger = logger.withUser(userId);
  
  componentLogger.debug('Rendering user dashboard', { 
    component: 'UserDashboard' 
  });

  try {
    // Track feature usage
    componentLogger.feature('dashboard', 'view', {
      viewport: 'desktop'
    });

    // Log performance metrics
    const endTimer = componentLogger.startTimer('component.render');
    
    // Component logic here...
    
    endTimer();
  } catch (error) {
    componentLogger.error('Dashboard render failed', error as Error);
  }
}

// Example 3: Database operation logging
export async function databaseOperationExample() {
  const dbLogger = createLogger({ layer: 'database' });
  
  const query = 'SELECT * FROM playlists WHERE user_id = $1';
  const params = ['user123'];
  
  const start = Date.now();
  
  try {
    // Simulate database query
    const result = await new Promise(resolve => 
      setTimeout(() => resolve([{ id: 1, name: 'My Playlist' }]), 50)
    );
    
    const duration = Date.now() - start;
    dbLogger.database(query, duration, params);
    
    return result;
  } catch (error) {
    dbLogger.error('Database query failed', error as Error, {
      query,
      params
    });
    throw error;
  }
}

// Example 4: Subscription service with audit logging
export async function subscriptionServiceExample(userId: string, plan: string) {
  const subscriptionLogger = logger
    .withUser(userId)
    .child({ service: 'subscription' });

  subscriptionLogger.info('Processing subscription upgrade', { 
    from: 'free', 
    to: plan 
  });

  try {
    // Simulate subscription upgrade
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Audit log for compliance
    subscriptionLogger.audit(
      'upgrade',
      'subscription',
      'success',
      {
        userId,
        plan,
        previousPlan: 'free',
        timestamp: new Date().toISOString()
      }
    );

    // Track business metrics
    subscriptionLogger.feature('subscription', 'upgrade', {
      fromTier: 'free',
      toTier: plan,
      upgradeSource: 'web'
    });

    return { success: true };
  } catch (error) {
    subscriptionLogger.error('Subscription upgrade failed', error as Error);
    
    subscriptionLogger.audit(
      'upgrade',
      'subscription',
      'failure',
      {
        userId,
        plan,
        error: (error as Error).message
      }
    );
    
    throw error;
  }
}

// Example 5: Error boundary logging
export function errorBoundaryLogger(error: Error, errorInfo: any) {
  const errorLogger = createLogger({ 
    layer: 'ui',
    errorBoundary: true 
  });

  errorLogger.error('React error boundary triggered', error, {
    componentStack: errorInfo.componentStack,
    digest: errorInfo.digest
  });
}

// Example 6: Client-side logging adapter (for use in client components)
// Note: This would need to send logs to an API endpoint
export function clientLogger(level: string, message: string, data?: any) {
  // In production, this would send logs to your logging endpoint
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}] ${message}`, data);
  } else {
    // Send to logging API
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    }).catch(err => console.error('Failed to send log:', err));
  }
}