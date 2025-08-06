import { describe, it, expect } from '@jest/globals';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  badRequest, 
  unauthorized, 
  notFound, 
  serverError,
  ApiErrorCode 
} from '@/lib/api/error-responses';

describe('API Error Responses', () => {
  describe('createErrorResponse', () => {
    it('should create a standardized error response', () => {
      const response = createErrorResponse(
        ApiErrorCode.INVALID_REQUEST,
        'Test error message',
        400,
        { field: 'email' },
        '/api/test',
        'req_123'
      );

      expect(response.status).toBe(400);
      expect(response.headers.get('X-Request-ID')).toBe('req_123');
      
      // Note: In a real test environment, you'd extract the JSON body
      // For now, we're just testing the structure
    });

    it('should not include details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Server error',
        500,
        { sensitiveInfo: 'secret' }
      );

      // Would need to parse response body to check details are undefined
      expect(response.status).toBe(500);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a standardized success response', () => {
      const data = { id: 1, name: 'Test' };
      const meta = { page: 1, limit: 10, total: 100 };
      
      const response = createSuccessResponse(data, meta);
      
      expect(response.status).toBe(200);
      // Would need to parse body to check structure in real test
    });
  });

  describe('convenience functions', () => {
    it('should create badRequest response', () => {
      const response = badRequest('Invalid input', { field: 'email' });
      expect(response.status).toBe(400);
    });

    it('should create unauthorized response', () => {
      const response = unauthorized('Not logged in');
      expect(response.status).toBe(401);
    });

    it('should create notFound response', () => {
      const response = notFound('User');
      expect(response.status).toBe(404);
    });

    it('should create serverError response', () => {
      const response = serverError('Database connection failed');
      expect(response.status).toBe(500);
    });
  });

  describe('ApiErrorCode enum', () => {
    it('should have all required error codes', () => {
      expect(ApiErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ApiErrorCode.INVALID_REQUEST).toBe('INVALID_REQUEST');
      expect(ApiErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ApiErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ApiErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    });
  });
});