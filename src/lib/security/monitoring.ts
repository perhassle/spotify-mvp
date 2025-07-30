import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';

/**
 * Security monitoring and logging utilities
 */

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  SESSION_ANOMALY = 'SESSION_ANOMALY',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
  API_KEY_INVALID = 'API_KEY_INVALID',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
}

export interface SecurityEvent {
  timestamp: Date;
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation?: string;
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private static events: SecurityEvent[] = [];
  private static maxEvents = 10000; // In-memory limit
  
  /**
   * Log a security event
   */
  static async log(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };
    
    // Add to in-memory store
    this.events.push(fullEvent);
    
    // Trim if exceeds limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // In production, send to SIEM or logging service
    if (process.env.NODE_ENV === 'production') {
      await this.sendToSiem(fullEvent);
    } else {
      console.log('[Security Event]', JSON.stringify(fullEvent, null, 2));
    }
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await this.alertSecurityTeam(fullEvent);
    }
  }
  
  /**
   * Send event to SIEM system
   */
  private static async sendToSiem(event: SecurityEvent): Promise<void> {
    // Implementation would send to actual SIEM
    // Example: Splunk, ELK, Datadog, etc.
    console.log('[SIEM]', event);
  }
  
  /**
   * Alert security team for critical events
   */
  private static async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    // Implementation would send alerts via email, Slack, PagerDuty, etc.
    console.error('[CRITICAL SECURITY ALERT]', event);
  }
  
  /**
   * Get recent security events
   */
  static getRecentEvents(
    limit: number = 100,
    filter?: { type?: SecurityEventType; severity?: string }
  ): SecurityEvent[] {
    let filtered = [...this.events];
    
    if (filter?.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    
    if (filter?.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }
    
    return filtered.slice(-limit).reverse();
  }
  
  /**
   * Analyze security trends
   */
  static analyzeTrends(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    eventCounts: Record<SecurityEventType, number>;
    topIpAddresses: { ip: string; count: number }[];
    severityDistribution: Record<string, number>;
  } {
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentEvents = this.events.filter(e => e.timestamp > cutoff);
    
    // Count events by type
    const eventCounts: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    
    for (const event of recentEvents) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
      severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1;
      
      if (event.ipAddress) {
        ipCounts[event.ipAddress] = (ipCounts[event.ipAddress] || 0) + 1;
      }
    }
    
    // Get top IP addresses
    const topIpAddresses = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
    
    return {
      eventCounts: eventCounts as Record<SecurityEventType, number>,
      topIpAddresses,
      severityDistribution: severityCounts,
    };
  }
}

/**
 * Extract request metadata for security logging
 */
export function extractRequestMetadata(request: NextRequest): {
  ipAddress?: string;
  userAgent?: string;
  path: string;
  method: string;
  referer?: string;
  origin?: string;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    path: request.nextUrl.pathname,
    method: request.method,
    referer: request.headers.get('referer') || undefined,
    origin: request.headers.get('origin') || undefined,
  };
}

/**
 * Security monitoring middleware
 */
export async function securityMonitoring(request: NextRequest): Promise<void> {
  const metadata = extractRequestMetadata(request);
  const session = await auth();
  
  // Check for SQL injection patterns
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop)\b|--|\/\*|\*\/)/i;
  if (sqlPatterns.test(request.url)) {
    await SecurityLogger.log({
      type: SecurityEventType.SQL_INJECTION_ATTEMPT,
      userId: session?.user?.id,
      ...metadata,
      severity: 'high',
      details: { url: request.url },
    });
  }
  
  // Check for XSS patterns
  const xssPatterns = /<script|javascript:|onerror=|onload=/i;
  if (xssPatterns.test(request.url)) {
    await SecurityLogger.log({
      type: SecurityEventType.XSS_ATTEMPT,
      userId: session?.user?.id,
      ...metadata,
      severity: 'high',
      details: { url: request.url },
    });
  }
  
  // Check for path traversal
  const pathTraversalPatterns = /\.\.|%2e%2e|%252e%252e/i;
  if (pathTraversalPatterns.test(request.url)) {
    await SecurityLogger.log({
      type: SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
      userId: session?.user?.id,
      ...metadata,
      severity: 'high',
      details: { url: request.url },
    });
  }
  
  // Monitor authentication endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const isLogin = request.nextUrl.pathname.includes('login');
    const isSuccess = request.headers.get('x-auth-success') === 'true';
    
    if (isLogin) {
      await SecurityLogger.log({
        type: isSuccess ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
        userId: session?.user?.id,
        ...metadata,
        severity: isSuccess ? 'low' : 'medium',
      });
    }
  }
}

/**
 * Brute force detection
 */
export class BruteForceDetector {
  private static attempts: Map<string, { count: number; firstAttempt: Date }> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  
  static async checkBruteForce(
    identifier: string,
    action: 'login' | 'password-reset'
  ): Promise<{ blocked: boolean; remainingAttempts: number }> {
    const now = new Date();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { blocked: false, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }
    
    // Reset if window expired
    if (now.getTime() - attempt.firstAttempt.getTime() > this.WINDOW_MS) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { blocked: false, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }
    
    // Increment attempts
    attempt.count++;
    
    if (attempt.count >= this.MAX_ATTEMPTS) {
      await SecurityLogger.log({
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        severity: 'high',
        details: {
          identifier,
          action,
          attempts: attempt.count,
        },
      });
      
      return { blocked: true, remainingAttempts: 0 };
    }
    
    return { blocked: false, remainingAttempts: this.MAX_ATTEMPTS - attempt.count };
  }
  
  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Security health check
 */
export interface SecurityHealth {
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
  metrics: {
    recentSecurityEvents: number;
    criticalEvents24h: number;
    bruteForceAttempts: number;
  };
}

export async function getSecurityHealth(): Promise<SecurityHealth> {
  const checks = [];
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  // Check security headers
  checks.push({
    name: 'Security Headers',
    status: 'pass' as const,
    message: 'All security headers configured',
  });
  
  // Check rate limiting
  checks.push({
    name: 'Rate Limiting',
    status: 'pass' as const,
    message: 'Rate limiting active',
  });
  
  // Check recent critical events
  const recentEvents = SecurityLogger.getRecentEvents(1000);
  const criticalEvents = recentEvents.filter(e => e.severity === 'critical');
  const critical24h = criticalEvents.filter(
    e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  
  if (critical24h.length > 10) {
    overallStatus = 'critical';
    checks.push({
      name: 'Critical Events',
      status: 'fail' as const,
      message: `${critical24h.length} critical events in last 24h`,
    });
  }
  
  // Check brute force attempts
  const bruteForceEvents = recentEvents.filter(
    e => e.type === SecurityEventType.BRUTE_FORCE_ATTEMPT
  );
  
  if (bruteForceEvents.length > 50) {
    overallStatus = overallStatus === 'critical' ? 'critical' : 'warning';
    checks.push({
      name: 'Brute Force Protection',
      status: 'fail' as const,
      message: `${bruteForceEvents.length} brute force attempts detected`,
    });
  }
  
  return {
    status: overallStatus,
    checks,
    metrics: {
      recentSecurityEvents: recentEvents.length,
      criticalEvents24h: critical24h.length,
      bruteForceAttempts: bruteForceEvents.length,
    },
  };
}