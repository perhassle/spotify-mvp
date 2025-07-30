import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  updateActivity: () => void;
  updateUser: (updates: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  lastActivity: Date.now(),
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
          });
        },

        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        login: (user) => {
          // Ensure user has subscription tier properties
          const enrichedUser = {
            ...user,
            subscriptionTier: user.subscriptionTier || 'free',
            subscriptionStatus: user.subscriptionStatus || 'active',
            isPremium: user.isPremium || false,
          };
          
          set({
            user: enrichedUser,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
          });
        },

        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        },

        updateActivity: () => {
          set({ lastActivity: Date.now() });
        },

        updateUser: (updates) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                ...updates,
                updatedAt: new Date(),
              },
            });
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastActivity: state.lastActivity,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);