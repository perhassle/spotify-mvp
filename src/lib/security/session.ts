import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/lib/auth/config';
import crypto from 'crypto';

/**
 * Enhanced session security utilities
 */

const SESSION_FINGERPRINT_COOKIE = '__Host-session-fp';
const DEVICE_ID_COOKIE = '__Host-device-id';

/**
 * Generate session fingerprint from request
 */
export function generateSessionFingerprint(request: Request): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  // Create fingerprint from stable request characteristics
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  return crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex');
}

/**
 * Generate unique device ID
 */
export function generateDeviceId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Set secure session cookies
 */
export async function setSecureSessionCookies(request: Request) {
  const cookieStore = await cookies();
  const fingerprint = generateSessionFingerprint(request);
  const deviceId = generateDeviceId();
  
  // Set session fingerprint cookie
  cookieStore.set(SESSION_FINGERPRINT_COOKIE, fingerprint, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  // Set device ID cookie
  cookieStore.set(DEVICE_ID_COOKIE, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  
  return { fingerprint, deviceId };
}

/**
 * Validate session fingerprint
 */
export async function validateSessionFingerprint(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const storedFingerprint = cookieStore.get(SESSION_FINGERPRINT_COOKIE)?.value;
  
  if (!storedFingerprint) {
    return false;
  }
  
  const currentFingerprint = generateSessionFingerprint(request);
  return storedFingerprint === currentFingerprint;
}

/**
 * Session anomaly detection
 */
export interface SessionAnomalyCheck {
  isValid: boolean;
  reason?: string;
}

export async function checkSessionAnomaly(request: Request): Promise<SessionAnomalyCheck> {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return { isValid: true }; // No session to check
  }
  
  // Check session fingerprint
  const fingerprintValid = await validateSessionFingerprint(request);
  if (!fingerprintValid) {
    return {
      isValid: false,
      reason: 'Session fingerprint mismatch - possible session hijacking attempt',
    };
  }
  
  // Check for suspicious patterns
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /scanner/i,
    /nmap/i,
    /havij/i,
    /acunetix/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return {
        isValid: false,
        reason: 'Suspicious user agent detected',
      };
    }
  }
  
  // Check for IP changes (if available)
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip');
  
  if (clientIp && session.user) {
    // Here you would check against stored session IP
    // For now, we'll just log it
    console.log(`Session IP check for user ${session.user.id}: ${clientIp}`);
  }
  
  return { isValid: true };
}

/**
 * Secure session storage for sensitive data
 */
export class SecureSessionStorage {
  private static encryptionKey = process.env.SESSION_ENCRYPTION_KEY || 
    crypto.randomBytes(32).toString('hex');
  
  /**
   * Encrypt sensitive session data
   */
  static encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  /**
   * Decrypt sensitive session data
   */
  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8') as string;
    decrypted += decipher.final('utf8') as string;
    
    return decrypted;
  }
}

/**
 * Session timeout management
 */
export interface SessionTimeout {
  absolute: number; // Absolute timeout in seconds
  idle: number; // Idle timeout in seconds
  warning: number; // Warning before timeout in seconds
}

export const SESSION_TIMEOUTS: Record<string, SessionTimeout> = {
  default: {
    absolute: 8 * 60 * 60, // 8 hours
    idle: 30 * 60, // 30 minutes
    warning: 5 * 60, // 5 minutes warning
  },
  premium: {
    absolute: 24 * 60 * 60, // 24 hours
    idle: 2 * 60 * 60, // 2 hours
    warning: 10 * 60, // 10 minutes warning
  },
  admin: {
    absolute: 2 * 60 * 60, // 2 hours
    idle: 15 * 60, // 15 minutes
    warning: 2 * 60, // 2 minutes warning
  },
};

/**
 * Check if session has timed out
 */
export function isSessionTimedOut(
  lastActivity: Date,
  sessionType: keyof typeof SESSION_TIMEOUTS = 'default'
): boolean {
  const timeout = SESSION_TIMEOUTS[sessionType];
  const now = Date.now();
  const lastActivityTime = lastActivity.getTime();
  
  return (now - lastActivityTime) > (timeout.idle * 1000);
}

/**
 * Session rotation for enhanced security
 */
export async function rotateSession(userId: string): Promise<string> {
  // Generate new session ID
  const newSessionId = crypto.randomBytes(32).toString('hex');
  
  // Here you would:
  // 1. Invalidate old session
  // 2. Create new session with new ID
  // 3. Update session store
  
  console.log(`Session rotated for user ${userId}: ${newSessionId}`);
  
  return newSessionId;
}

/**
 * Multi-factor session validation
 */
export interface SessionValidation {
  isValid: boolean;
  requiresReauth: boolean;
  reason?: string;
}

export async function validateSecureSession(
  request: Request,
  requireMfa: boolean = false
): Promise<SessionValidation> {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return {
      isValid: false,
      requiresReauth: true,
      reason: 'No active session',
    };
  }
  
  // Check session anomalies
  const anomalyCheck = await checkSessionAnomaly(request);
  if (!anomalyCheck.isValid) {
    return {
      isValid: false,
      requiresReauth: true,
      reason: anomalyCheck.reason,
    };
  }
  
  // Check if MFA is required but not completed
  if (requireMfa && !session.user.mfaVerified) {
    return {
      isValid: true,
      requiresReauth: true,
      reason: 'MFA verification required',
    };
  }
  
  return { isValid: true, requiresReauth: false };
}