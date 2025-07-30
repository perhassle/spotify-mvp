import pino from 'pino';
import { randomUUID } from 'crypto';

// Define log levels
export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

// Logger configuration based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Create base logger with environment-specific settings
const baseLogger = pino({
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    }),
    error: pino.stdSerializers.err,
  },
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss.l',
        singleLine: false,
      },
    },
  }),
  ...(isProduction && {
    // Production settings for structured JSON logging
    messageKey: 'message',
    errorKey: 'error',
    base: {
      env: process.env.NODE_ENV,
      service: 'spotify-mvp',
      version: process.env.npm_package_version,
    },
  }),
});

// Context-aware logger interface
interface LoggerContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  feature?: string;
  action?: string;
  [key: string]: any;
}

// Performance logging interface
interface PerformanceLog {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}

// Logger class with context support
class StructuredLogger {
  private logger: pino.Logger;
  private defaultContext: LoggerContext;

  constructor(context: LoggerContext = {}) {
    this.defaultContext = context;
    this.logger = baseLogger.child(context);
  }

  // Create a child logger with additional context
  child(context: LoggerContext): StructuredLogger {
    return new StructuredLogger({
      ...this.defaultContext,
      ...context,
    });
  }

  // Generate request ID if not provided
  withRequestId(requestId?: string): StructuredLogger {
    return this.child({
      requestId: requestId || randomUUID(),
    });
  }

  // Add user context
  withUser(userId: string, sessionId?: string): StructuredLogger {
    return this.child({
      userId,
      ...(sessionId && { sessionId }),
    });
  }

  // Core logging methods
  fatal(message: string, data?: any): void {
    this.logger.fatal(data, message);
  }

  error(message: string, error?: Error | any, data?: any): void {
    if (error instanceof Error) {
      this.logger.error({ error, ...data }, message);
    } else {
      this.logger.error({ ...error, ...data }, message);
    }
  }

  warn(message: string, data?: any): void {
    this.logger.warn(data, message);
  }

  info(message: string, data?: any): void {
    this.logger.info(data, message);
  }

  debug(message: string, data?: any): void {
    this.logger.debug(data, message);
  }

  trace(message: string, data?: any): void {
    this.logger.trace(data, message);
  }

  // Performance logging
  performance(perfLog: PerformanceLog): void {
    const { operation, duration, metadata } = perfLog;
    this.info(`Performance: ${operation}`, {
      performance: {
        operation,
        duration,
        durationUnit: 'ms',
        ...metadata,
      },
    });
  }

  // HTTP request/response logging
  http(req: any, res: any, responseTime: number): void {
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    this.logger[level]({
      req,
      res,
      responseTime,
      type: 'http',
    }, `${req.method} ${req.url} ${statusCode} ${responseTime}ms`);
  }

  // Database query logging
  database(query: string, duration: number, params?: any[]): void {
    this.debug('Database query executed', {
      database: {
        query,
        duration,
        durationUnit: 'ms',
        params: isDevelopment ? params : undefined, // Only log params in dev
      },
    });
  }

  // Feature usage tracking
  feature(featureName: string, action: string, metadata?: any): void {
    this.info(`Feature usage: ${featureName}`, {
      feature: {
        name: featureName,
        action,
        ...metadata,
      },
    });
  }

  // Audit logging for sensitive operations
  audit(action: string, resource: string, result: 'success' | 'failure', metadata?: any): void {
    this.info(`Audit: ${action} on ${resource}`, {
      audit: {
        action,
        resource,
        result,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  // Timer utility for performance measurement
  startTimer(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.performance({ operation, duration });
    };
  }
}

// Create and export default logger instance
export const logger = new StructuredLogger();

// Export logger class for creating custom instances
export { StructuredLogger };

// Utility function for async operation timing
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  loggerInstance: StructuredLogger = logger
): Promise<T> {
  const endTimer = loggerInstance.startTimer(operation);
  try {
    const result = await fn();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

// Helper for creating operation-specific loggers
export function createLogger(context: LoggerContext): StructuredLogger {
  return new StructuredLogger(context);
}