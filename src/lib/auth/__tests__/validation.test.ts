import { loginSchema, registrationSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues?.length).toBeGreaterThan(0);
        expect(result.error?.issues?.[0]?.path).toContain('email');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues?.length).toBeGreaterThan(0);
        expect(result.error?.issues?.[0]?.path).toContain('password');
      }
    });
  });

  describe('registrationSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: 'testuser',
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        username: 'testuser',
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues?.length).toBeGreaterThan(0);
        expect(result.error?.issues?.[0]?.message).toContain('Passwords must match');
      }
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        username: 'testuser',
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues?.length).toBeGreaterThan(0);
        expect(result.error?.issues?.[0]?.path).toContain('password');
      }
    });

    it('should reject invalid username', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: 'ab', // Too short
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues?.length).toBeGreaterThan(0);
        expect(result.error?.issues?.[0]?.path).toContain('username');
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'test@example.com',
      };
      
      const result = forgotPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
      };
      
      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate correct reset data', () => {
      const validData = {
        token: 'valid-reset-token-123',
        password: 'NewSecurePass123!',
        confirmPassword: 'NewSecurePass123!',
      };
      
      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
        password: 'NewSecurePass123!',
        confirmPassword: 'NewSecurePass123!',
      };
      
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});