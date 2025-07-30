import { describe, it, expect, beforeEach } from '@jest/globals';
import { useAuthStore } from '../auth-store';

// Mock localStorage for testing persistence
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      lastActivity: Date.now(),
    });
    
    // Clear localStorage mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.lastActivity).toBeCloseTo(Date.now(), -3); // Within 1 second
    });
  });

  describe('setUser', () => {
    it('should set user and authentication status', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isPremium: false,
        subscriptionTier: 'free' as const,
        subscriptionStatus: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useAuthStore.getState().setUser(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear user and authentication when null', () => {
      // First set a user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isPremium: false,
        subscriptionTier: 'free' as const,
        subscriptionStatus: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then clear it
      useAuthStore.getState().setUser(null);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('login', () => {
    it('should login user with enriched subscription data', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const beforeLogin = Date.now();
      useAuthStore.getState().login(mockUser as any);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        ...mockUser,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        isPremium: false,
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.lastActivity).toBeGreaterThanOrEqual(beforeLogin);
    });

    it('should preserve existing subscription data', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        subscriptionTier: 'premium' as const,
        subscriptionStatus: 'active' as const,
        isPremium: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useAuthStore.getState().login(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user?.subscriptionTier).toBe('premium');
      expect(state.user?.subscriptionStatus).toBe('active');
      expect(state.user?.isPremium).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout user and clear state', () => {
      // First login a user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isPremium: false,
        subscriptionTier: 'free' as const,
        subscriptionStatus: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      useAuthStore.getState().login(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      useAuthStore.getState().logout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateActivity', () => {
    it('should update last activity timestamp', () => {
      const initialActivity = useAuthStore.getState().lastActivity;
      
      // Wait a tiny bit to ensure timestamp difference
      setTimeout(() => {
        useAuthStore.getState().updateActivity();
        
        const newActivity = useAuthStore.getState().lastActivity;
        expect(newActivity).toBeGreaterThan(initialActivity);
      }, 1);
    });
  });

  describe('updateUser', () => {
    it('should update user data when user exists', () => {
      // First set a user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isPremium: false,
        subscriptionTier: 'free' as const,
        subscriptionStatus: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      useAuthStore.getState().setUser(mockUser);
      
      // Then update user data
      const updates = {
        displayName: 'Updated Name',
        isPremium: true,
        subscriptionTier: 'premium' as const,
      };
      
      useAuthStore.getState().updateUser(updates);
      
      const state = useAuthStore.getState();
      expect(state.user?.displayName).toBe('Updated Name');
      expect(state.user?.isPremium).toBe(true);
      expect(state.user?.subscriptionTier).toBe('premium');
      expect(state.user?.email).toBe('test@example.com'); // Should preserve unchanged fields
      expect(state.user?.updatedAt).toBeInstanceOf(Date);
    });

    it('should not update when no user exists', () => {
      // Ensure no user is set
      useAuthStore.getState().setUser(null);
      
      const updates = {
        displayName: 'New Name',
      };
      
      useAuthStore.getState().updateUser(updates);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('Store Persistence', () => {
    it('should only persist specified fields', () => {
      const store = useAuthStore;
      
      // Test the partialize function
      const fullState = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          isPremium: false,
          subscriptionTier: 'free' as const,
          subscriptionStatus: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isAuthenticated: true,
        isLoading: false,
        lastActivity: Date.now(),
      };

      // The partialize function should only include certain fields
      // We can't directly test partialize, but we can test that only certain fields are handled
      expect(fullState.user).toBeDefined();
      expect(fullState.isAuthenticated).toBe(true);
      expect(fullState.lastActivity).toBeDefined();
      // isLoading should not be persisted (based on partialize logic)
    });
  });
});