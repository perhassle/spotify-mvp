import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { 
  validateRequest, 
  loginSchema, 
  registerSchema,
  playlistCreateSchema 
} from '@/lib/api/validate-request';

describe('API Request Validation', () => {
  describe('validateRequest', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(0, 'Age must be positive'),
    });

    it('should return data for valid input', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const validator = validateRequest(testSchema);
      const result = validator(validData);

      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return error for invalid input', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -5,
      };

      const validator = validateRequest(testSchema);
      const result = validator(invalidData);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(400);
      }
    });

    it('should handle missing fields', () => {
      const incompleteData = {
        name: 'John',
        // missing email and age
      };

      const validator = validateRequest(testSchema);
      const result = validator(incompleteData);

      expect('error' in result).toBe(true);
    });
  });

  describe('predefined schemas', () => {
    describe('loginSchema', () => {
      it('should validate correct login data', () => {
        const validLogin = {
          email: 'user@example.com',
          password: 'password123',
        };

        const result = loginSchema.safeParse(validLogin);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidLogin = {
          email: 'not-an-email',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidLogin);
        expect(result.success).toBe(false);
      });

      it('should reject short password', () => {
        const invalidLogin = {
          email: 'user@example.com',
          password: '123',
        };

        const result = loginSchema.safeParse(invalidLogin);
        expect(result.success).toBe(false);
      });
    });

    describe('registerSchema', () => {
      it('should validate correct registration data', () => {
        const validRegistration = {
          email: 'new@example.com',
          password: 'password123',
          username: 'newuser',
          displayName: 'New User',
        };

        const result = registerSchema.safeParse(validRegistration);
        expect(result.success).toBe(true);
      });

      it('should reject short username', () => {
        const invalidRegistration = {
          email: 'new@example.com',
          password: 'password123',
          username: 'ab',
          displayName: 'New User',
        };

        const result = registerSchema.safeParse(invalidRegistration);
        expect(result.success).toBe(false);
      });

      it('should reject long username', () => {
        const invalidRegistration = {
          email: 'new@example.com',
          password: 'password123',
          username: 'a'.repeat(51),
          displayName: 'New User',
        };

        const result = registerSchema.safeParse(invalidRegistration);
        expect(result.success).toBe(false);
      });
    });

    describe('playlistCreateSchema', () => {
      it('should validate correct playlist data', () => {
        const validPlaylist = {
          name: 'My Playlist',
          description: 'A great playlist',
          isPublic: true,
          collaborative: false,
          tags: ['rock', 'indie'],
        };

        const result = playlistCreateSchema.safeParse(validPlaylist);
        expect(result.success).toBe(true);
      });

      it('should use default values for optional fields', () => {
        const minimalPlaylist = {
          name: 'Simple Playlist',
        };

        const result = playlistCreateSchema.safeParse(minimalPlaylist);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isPublic).toBe(false);
          expect(result.data.collaborative).toBe(false);
          expect(result.data.tags).toEqual([]);
        }
      });

      it('should reject empty name', () => {
        const invalidPlaylist = {
          name: '',
        };

        const result = playlistCreateSchema.safeParse(invalidPlaylist);
        expect(result.success).toBe(false);
      });
    });
  });
});