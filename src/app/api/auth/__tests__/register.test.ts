import { registrationSchema } from '@/lib/auth/validation';

// Mock the database
jest.mock('@/lib/auth/database', () => ({
  authDB: {
    createUser: jest.fn(),
  },
}));

// Mock the security modules  
jest.mock('@/lib/security/monitoring', () => ({
  BruteForceDetector: {
    checkBruteForce: jest.fn().mockResolvedValue({ blocked: false }),
  },
  SecurityLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
  SecurityEventType: {
    BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS', 
    LOGIN_FAILURE: 'LOGIN_FAILURE',
  },
  extractRequestMetadata: jest.fn().mockReturnValue({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      startTimer: jest.fn().mockReturnValue(jest.fn()),
      audit: jest.fn(),
      feature: jest.fn(),
    }),
  },
}));

// Mock middleware
jest.mock('@/middleware/logging', () => ({
  withLogging: (handler: any) => handler,
  auditMiddleware: (_entity: string, _action: string) => (handler: any) => handler,
  performanceMiddleware: (_operation: string) => (handler: any) => handler,
}));

// Mock API error handler
jest.mock('@/lib/api-error-handler', () => ({
  handleApiError: jest.fn().mockImplementation((error: Error) => ({
    status: 400,
    json: jest.fn().mockResolvedValue({
      success: false,
      message: error.message,
    }),
  })),
  ApiErrors: {
    rateLimitExceeded: jest.fn().mockImplementation((seconds: number) => 
      new Error(`Rate limit exceeded. Try again in ${seconds} seconds.`)
    ),
  },
}));

// Mock security sanitization
jest.mock('@/lib/security/sanitization', () => ({
  sanitizeObject: jest.fn().mockImplementation((obj: any) => obj),
}));

import { authDB } from '@/lib/auth/database';

const mockAuthDB = authDB as jest.Mocked<typeof authDB>;

describe('Registration Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate registration data correctly', () => {
    const validData = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    };

    const result = registrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
      username: 'testuser',
      displayName: 'Test User',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    };

    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('email');
    }
  });

  it('should reject weak password', () => {
    const invalidData = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'weak',
      confirmPassword: 'weak',
    };

    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('password');
    }
  });

  it('should reject mismatched passwords', () => {
    const invalidData = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass123!',
    };

    const result = registrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Passwords don't match");
    }
  });

  it('should create user when called with valid data', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      isPremium: false,
      subscriptionTier: 'free' as const,
      subscriptionStatus: 'canceled' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuthDB.createUser.mockResolvedValue(mockUser);

    const result = await mockAuthDB.createUser(
      'test@example.com',
      'SecurePass123!',
      'testuser',
      'Test User'
    );

    expect(result).toEqual(mockUser);
    expect(mockAuthDB.createUser).toHaveBeenCalledWith(
      'test@example.com',
      'SecurePass123!',
      'testuser',
      'Test User'
    );
  });

  it('should throw error for existing email', async () => {
    mockAuthDB.createUser.mockRejectedValue(new Error('User with this email already exists'));

    await expect(
      mockAuthDB.createUser('existing@example.com', 'SecurePass123!', 'testuser', 'Test User')
    ).rejects.toThrow('User with this email already exists');
  });

  it('should throw error for existing username', async () => {
    mockAuthDB.createUser.mockRejectedValue(new Error('Username is already taken'));

    await expect(
      mockAuthDB.createUser('test@example.com', 'SecurePass123!', 'existinguser', 'Test User')
    ).rejects.toThrow('Username is already taken');
  });

  it('should handle database errors gracefully', async () => {
    mockAuthDB.createUser.mockRejectedValue(new Error('Database connection failed'));

    await expect(
      mockAuthDB.createUser('test@example.com', 'SecurePass123!', 'testuser', 'Test User')
    ).rejects.toThrow('Database connection failed');
  });
});