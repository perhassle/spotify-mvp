/**
 * Test configuration for E2E tests
 * Use environment variables to avoid hardcoding credentials
 */
export const testConfig = {
  // Test user credentials from environment or defaults
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123',
  },
  
  // URLs
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
  httpsUrl: process.env.TEST_HTTPS_URL || 'https://localhost:3001',
};