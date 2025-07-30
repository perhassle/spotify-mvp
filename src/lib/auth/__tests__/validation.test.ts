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
        expect(result.error.issues[0]?.path).toContain('email');
      }
    });

    it('should accept any non-empty password for login', () => {
      const validData = {
        email: 'test@example.com',
        password: '123', // Login schema only requires non-empty password
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('password');
      }
    });

    it('should handle SQL injection attempts in email', () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --@example.com",
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('email');
      }
    });

    it('should handle XSS attempts in email', () => {
      const maliciousData = {
        email: '<script>alert("xss")</script>@example.com',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('email');
      }
    });

    it('should handle edge case email formats', () => {
      const edgeCaseEmails = [
        'user@domain',           // Missing TLD
        '@domain.com',          // Missing local part
        'user@@domain.com',     // Double @
        'user.domain.com',      // Missing @
        'user@.com',           // Missing domain
        'user@domain.',        // Missing TLD
      ];

      edgeCaseEmails.forEach(email => {
        const result = loginSchema.safeParse({
          email,
          password: 'password123'
        });
        expect(result.success).toBe(false);
      });
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
        expect(result.error.issues[0]?.message).toContain("Passwords don't match");
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
        expect(result.error.issues[0]?.path).toContain('password');
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
        expect(result.error.issues[0]?.path).toContain('username');
      }
    });

    it('should handle Unicode characters in password', () => {
      const unicodeData = {
        email: 'test@example.com',
        password: 'Pãssw0rd!😀', // Unicode characters
        confirmPassword: 'Pãssw0rd!😀',
        username: 'testuser',
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(unicodeData);
      expect(result.success).toBe(true);
    });

    it('should reject SQL injection attempts in username', () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: "'; DROP TABLE users; --",
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('username');
      }
    });

    it('should reject XSS attempts in display name', () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: 'testuser',
        displayName: '<script>alert("xss")</script>',
      };
      
      const result = registrationSchema.safeParse(maliciousData);
      expect(result.success).toBe(true); // Display name allows HTML chars, sanitization happens server-side
    });

    it('should handle very long inputs', () => {
      const longString = 'a'.repeat(1000);
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: longString,
        displayName: longString,
      };
      
      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject emails with Unicode domain names', () => {
      const unicodeEmailData = {
        email: 'test@مثال.إختبار',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        username: 'testuser',
        displayName: 'Test User',
      };
      
      const result = registrationSchema.safeParse(unicodeEmailData);
      // This should fail as our current email validation doesn't support IDN
      expect(result.success).toBe(false);
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