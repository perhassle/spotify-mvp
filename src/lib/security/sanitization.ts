import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

/**
 * Input sanitization utilities for preventing XSS attacks
 */

// HTML sanitization configuration
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side sanitization
    return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG);
  }
  // Client-side sanitization
  return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG);
}

/**
 * Sanitize user input for display (removes all HTML)
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags and decode HTML entities
  const text = input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
  
  return text;
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', '/'];
  const hasValidProtocol = safeProtocols.some(protocol => 
    trimmedUrl.startsWith(protocol) || (!trimmedUrl.includes(':') && trimmedUrl.startsWith('/'))
  );
  
  if (!hasValidProtocol && !trimmedUrl.startsWith('/')) {
    // Assume https:// for URLs without protocol
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove directory traversal patterns and special characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/^\.+/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255); // Limit length
}

/**
 * Sanitize JSON input to prevent injection
 */
export function sanitizeJson(input: unknown): unknown {
  if (typeof input === 'string') {
    return sanitizeText(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeJson(item));
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize keys to prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[sanitizeText(key)] = sanitizeJson(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * SQL-safe string escaping (for raw queries, prefer parameterized queries)
 */
export function escapeSql(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    });
}

/**
 * Create a sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remove special characters that could be used for injection
  return query
    .replace(/[<>\"'&]/g, '')
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Sanitize object keys recursively to prevent prototype pollution
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }
  
  return sanitized;
}

/**
 * Content type validation schemas
 */
export const contentValidationSchemas = {
  // User-generated content
  userContent: z.object({
    title: z.string().max(200).transform(sanitizeText),
    description: z.string().max(1000).transform(sanitizeText),
    content: z.string().max(10000).transform(sanitizeHtml),
  }),
  
  // Playlist creation
  playlist: z.object({
    name: z.string().min(1).max(100).transform(sanitizeText),
    description: z.string().max(300).optional().transform(val => val ? sanitizeText(val) : undefined),
    isPublic: z.boolean(),
  }),
  
  // Search query
  searchQuery: z.object({
    q: z.string().min(1).max(100).transform(sanitizeSearchQuery),
    type: z.enum(['track', 'album', 'artist', 'playlist']).optional(),
    limit: z.number().min(1).max(50).optional(),
  }),
  
  // File upload
  fileUpload: z.object({
    filename: z.string().transform(sanitizeFilename),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    size: z.number().max(5 * 1024 * 1024), // 5MB max
  }),
};

/**
 * Export types for sanitized content
 */
export type SanitizedUserContent = z.infer<typeof contentValidationSchemas.userContent>;
export type SanitizedPlaylist = z.infer<typeof contentValidationSchemas.playlist>;
export type SanitizedSearchQuery = z.infer<typeof contentValidationSchemas.searchQuery>;
export type SanitizedFileUpload = z.infer<typeof contentValidationSchemas.fileUpload>;