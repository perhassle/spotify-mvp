import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SocialState, 
  ArtistFollowStats, 
  Notification, 
  SocialProfile, 
  ShareActivity,
  ShareableContent,
  ShareModalState
} from '@/types';

interface SocialStore extends SocialState {
  // Actions for following
  followArtist: (artistId: string) => Promise<void>;
  unfollowArtist: (artistId: string) => Promise<void>;
  fetchFollowedArtists: () => Promise<void>;
  updateArtistStats: (artistId: string, stats: ArtistFollowStats) => void;
  
  // Actions for notifications
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Actions for social profile
  fetchSocialProfile: (userId?: string) => Promise<void>;
  updateSocialProfile: (updates: Partial<SocialProfile>) => Promise<void>;
  
  // Actions for friend activity
  fetchFriendActivity: () => Promise<void>;
  
  // Actions for share history
  fetchShareHistory: () => Promise<void>;
  addShareActivity: (activity: ShareActivity) => void;
  
  // General actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Share modal store (separate from main social store for performance)
interface ShareModalStore extends ShareModalState {
  openShareModal: (content: ShareableContent) => void;
  closeShareModal: () => void;
  setActiveTab: (tab: ShareModalState['activeTab']) => void;
  setCustomMessage: (message: string) => void;
  addSelectedPlatform: (platform: string) => void;
  removeSelectedPlatform: (platform: string) => void;
  addEmailRecipient: (email: string) => void;
  removeEmailRecipient: (email: string) => void;
  updateEmbedOptions: (options: Partial<ShareModalState['embedOptions']>) => void;
  resetShareModal: () => void;
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      // Initial state
      followedArtists: [],
      followingStats: {},
      notifications: [],
      unreadNotificationCount: 0,
      socialProfile: null,
      friendActivity: [],
      shareHistory: [],
      isLoading: false,
      error: null,

      // Following actions
      followArtist: async (artistId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/artist/${artistId}/follow`, {
            method: 'POST',
          });
          
          const data = await response.json();
          
          if (data.success) {
            const { followedArtist, stats } = data.data;
            
            set(state => ({
              followedArtists: [...state.followedArtists, followedArtist],
              followingStats: {
                ...state.followingStats,
                [artistId]: stats,
              },
              isLoading: false,
            }));
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to follow artist', isLoading: false });
        }
      },

      unfollowArtist: async (artistId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/artist/${artistId}/follow`, {
            method: 'DELETE',
          });
          
          const data = await response.json();
          
          if (data.success) {
            set(state => ({
              followedArtists: state.followedArtists.filter(
                f => f.artistId !== artistId
              ),
              followingStats: {
                ...state.followingStats,
                [artistId]: data.data.stats,
              },
              isLoading: false,
            }));
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to unfollow artist', isLoading: false });
        }
      },

      fetchFollowedArtists: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/following');
          const data = await response.json();
          
          if (data.success) {
            set({
              followedArtists: data.data.followedArtists,
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch followed artists', isLoading: false });
        }
      },

      updateArtistStats: (artistId: string, stats: ArtistFollowStats) => {
        set(state => ({
          followingStats: {
            ...state.followingStats,
            [artistId]: stats,
          },
        }));
      },

      // Notification actions
      fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/notifications');
          const data = await response.json();
          
          if (data.success) {
            const notifications = data.data.notifications || [];
            const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
            
            set({
              notifications,
              unreadNotificationCount: unreadCount,
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch notifications', isLoading: false });
        }
      },

      markNotificationAsRead: (notificationId: string) => {
        set(state => {
          const updatedNotifications = state.notifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          );
          
          return {
            notifications: updatedNotifications,
            unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
          };
        });
        
        // Update on server
        fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
          .catch(error => console.error('Failed to mark notification as read:', error));
      },

      markAllNotificationsAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date(),
          })),
          unreadNotificationCount: 0,
        }));
        
        // Update on server
        fetch('/api/notifications/read-all', { method: 'POST' })
          .catch(error => console.error('Failed to mark all notifications as read:', error));
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadNotificationCount: 0,
        });
      },

      // Social profile actions
      fetchSocialProfile: async (userId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const url = userId ? `/api/profile/${userId}` : '/api/profile';
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.success) {
            set({
              socialProfile: data.data.profile,
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch social profile', isLoading: false });
        }
      },

      updateSocialProfile: async (updates: Partial<SocialProfile>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          const data = await response.json();
          
          if (data.success) {
            set(state => ({
              socialProfile: state.socialProfile 
                ? { ...state.socialProfile, ...updates }
                : null,
              isLoading: false,
            }));
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to update profile', isLoading: false });
        }
      },

      // Friend activity actions
      fetchFriendActivity: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/social/activity');
          const data = await response.json();
          
          if (data.success) {
            set({
              friendActivity: data.data.activities || [],
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch friend activity', isLoading: false });
        }
      },

      // Share history actions
      fetchShareHistory: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/share');
          const data = await response.json();
          
          if (data.success) {
            set({
              shareHistory: data.data.shares || [],
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to fetch share history', isLoading: false });
        }
      },

      addShareActivity: (activity: ShareActivity) => {
        set(state => ({
          shareHistory: [activity, ...state.shareHistory],
        }));
      },

      // General actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'social-store',
      partialize: (state) => ({
        followedArtists: state.followedArtists,
        followingStats: state.followingStats,
        socialProfile: state.socialProfile,
      }),
    }
  )
);

export const useShareModalStore = create<ShareModalStore>()((set, get) => ({
  // Initial state
  isOpen: false,
  content: null,
  activeTab: 'social',
  customMessage: '',
  selectedPlatforms: [],
  emailRecipients: [],
  embedOptions: {},

  // Actions
  openShareModal: (content: ShareableContent) => {
    set({
      isOpen: true,
      content,
      activeTab: 'social',
      customMessage: '',
      selectedPlatforms: [],
      emailRecipients: [],
      embedOptions: {},
    });
  },

  closeShareModal: () => {
    set({ isOpen: false });
  },

  setActiveTab: (tab: ShareModalState['activeTab']) => {
    set({ activeTab: tab });
  },

  setCustomMessage: (message: string) => {
    set({ customMessage: message });
  },

  addSelectedPlatform: (platform: string) => {
    set(state => ({
      selectedPlatforms: [...state.selectedPlatforms, platform],
    }));
  },

  removeSelectedPlatform: (platform: string) => {
    set(state => ({
      selectedPlatforms: state.selectedPlatforms.filter(p => p !== platform),
    }));
  },

  addEmailRecipient: (email: string) => {
    set(state => ({
      emailRecipients: [...state.emailRecipients, email],
    }));
  },

  removeEmailRecipient: (email: string) => {
    set(state => ({
      emailRecipients: state.emailRecipients.filter(e => e !== email),
    }));
  },

  updateEmbedOptions: (options: Partial<ShareModalState['embedOptions']>) => {
    set(state => ({
      embedOptions: { ...state.embedOptions, ...options },
    }));
  },

  resetShareModal: () => {
    set({
      isOpen: false,
      content: null,
      activeTab: 'social',
      customMessage: '',
      selectedPlatforms: [],
      emailRecipients: [],
      embedOptions: {},
    });
  },
}));