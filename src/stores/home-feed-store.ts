import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  HomeFeed,
  HomeFeedSection,
  HomeFeedSectionType,
  UserBehavior,
} from "@/types";
import { SpotifyRecommendationEngine } from "@/lib/recommendations/recommendation-engine";
import { useAuthStore } from "./auth-store";

interface HomeFeedState {
  homeFeed: HomeFeed | null;
  isLoading: boolean;
  error: string | null;
  refreshing: Record<string, boolean>; // Track which sections are refreshing
  lastFetchTime: Date | null;
  userBehaviorQueue: UserBehavior[];
}

interface HomeFeedActions {
  // Main feed operations
  loadHomeFeed: (userId: string, force?: boolean) => Promise<void>;
  refreshHomeFeed: (userId: string) => Promise<void>;
  refreshSection: (userId: string, sectionType: HomeFeedSectionType) => Promise<void>;
  
  // User interaction tracking
  trackUserBehavior: (behavior: UserBehavior) => Promise<void>;
  trackSectionView: (sectionId: string) => void;
  trackTrackClick: (sectionId: string, trackId: string) => void;
  trackTrackPlay: (sectionId: string, trackId: string) => void;
  trackTrackSkip: (sectionId: string, trackId: string) => void;
  trackTrackLike: (sectionId: string, trackId: string) => void;
  trackTrackShare: (sectionId: string, trackId: string) => void;
  
  // Section management
  hideSection: (sectionId: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

type HomeFeedStore = HomeFeedState & HomeFeedActions;

const initialState: HomeFeedState = {
  homeFeed: null,
  isLoading: false,
  error: null,
  refreshing: {},
  lastFetchTime: null,
  userBehaviorQueue: [],
};

// Global recommendation engine instance
let recommendationEngine: SpotifyRecommendationEngine | null = null;

const getRecommendationEngine = () => {
  if (!recommendationEngine) {
    recommendationEngine = new SpotifyRecommendationEngine();
  }
  return recommendationEngine;
};

export const useHomeFeedStore = create<HomeFeedStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      loadHomeFeed: async (userId: string, force = false) => {
        const state = get();
        
        // Don't load if already loading
        if (state.isLoading && !force) return;
        
        // Check if we need to refresh (cache TTL: 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (!force && state.homeFeed && state.lastFetchTime && state.lastFetchTime > thirtyMinutesAgo) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const engine = getRecommendationEngine();
          const homeFeed = await engine.getHomeFeed(userId, force);
          
          set({
            homeFeed,
            isLoading: false,
            lastFetchTime: new Date(),
            error: null,
          });
          
        } catch (error) {
          console.error('Failed to load home feed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load home feed',
            isLoading: false,
          });
        }
      },

      refreshHomeFeed: async (userId: string) => {
        await get().loadHomeFeed(userId, true);
      },

      refreshSection: async (userId: string, sectionType: HomeFeedSectionType) => {
        const state = get();
        if (!state.homeFeed) return;

        // Mark section as refreshing
        set({
          refreshing: {
            ...state.refreshing,
            [sectionType]: true,
          },
        });

        try {
          const engine = getRecommendationEngine();
          
          // Generate new recommendations for this section
          const request = {
            userId,
            sectionType,
            limit: 20,
            excludeTrackIds: [], // Could exclude recently played
          };

          const response = await engine.generateRecommendations(request);
          
          // Update the specific section in the home feed
          const updatedSections = state.homeFeed.sections.map(section => {
            if (section.type === sectionType) {
              return {
                ...section,
                tracks: response.tracks,
                metadata: {
                  ...section.metadata,
                  lastRefreshed: new Date(),
                },
              };
            }
            return section;
          });

          set({
            homeFeed: {
              ...state.homeFeed,
              sections: updatedSections,
              lastRefreshed: new Date(),
            },
            refreshing: {
              ...state.refreshing,
              [sectionType]: false,
            },
          });

        } catch (error) {
          console.error('Failed to refresh section:', error);
          set({
            refreshing: {
              ...state.refreshing,
              [sectionType]: false,
            },
            error: error instanceof Error ? error.message : 'Failed to refresh section',
          });
        }
      },

      trackUserBehavior: async (behavior: UserBehavior) => {
        const state = get();
        
        // Add to queue for batch processing
        set({
          userBehaviorQueue: [...state.userBehaviorQueue, behavior],
        });

        // Process behavior immediately for real-time updates
        try {
          const engine = getRecommendationEngine();
          await engine.updateUserBehavior(behavior);
          
          // Update engagement metrics for the relevant section
          if (state.homeFeed) {
            const updatedSections = state.homeFeed.sections.map(section => {
              // Find if this behavior relates to tracks in this section
              const hasTrack = section.tracks.some(track => track.trackId === behavior.trackId);
              
              if (hasTrack) {
                const updatedEngagement = { ...section.metadata.userEngagement };
                
                switch (behavior.action) {
                  case 'play':
                    updatedEngagement.playCount++;
                    break;
                  case 'skip':
                    updatedEngagement.skipCount++;
                    break;
                  case 'like':
                    updatedEngagement.likeCount++;
                    break;
                  case 'share':
                    updatedEngagement.shareCount++;
                    break;
                }

                return {
                  ...section,
                  metadata: {
                    ...section.metadata,
                    userEngagement: updatedEngagement,
                  },
                };
              }
              
              return section;
            });

            set({
              homeFeed: {
                ...state.homeFeed,
                sections: updatedSections,
              },
            });
          }

        } catch (error) {
          console.error('Failed to track user behavior:', error);
        }
      },

      trackSectionView: (sectionId: string) => {
        const state = get();
        if (!state.homeFeed) return;

        const updatedSections = state.homeFeed.sections.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              metadata: {
                ...section.metadata,
                userEngagement: {
                  ...section.metadata.userEngagement,
                  viewCount: section.metadata.userEngagement.viewCount + 1,
                },
              },
            };
          }
          return section;
        });

        set({
          homeFeed: {
            ...state.homeFeed,
            sections: updatedSections,
          },
        });
      },

      trackTrackClick: (sectionId: string, trackId: string) => {
        const state = get();
        if (!state.homeFeed) return;

        // Update click count for the section
        const updatedSections = state.homeFeed.sections.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              metadata: {
                ...section.metadata,
                userEngagement: {
                  ...section.metadata.userEngagement,
                  clickCount: section.metadata.userEngagement.clickCount + 1,
                },
              },
            };
          }
          return section;
        });

        set({
          homeFeed: {
            ...state.homeFeed,
            sections: updatedSections,
          },
        });

        // Track user behavior
        const user = useAuthStore.getState().user;
        if (user) {
          get().trackUserBehavior({
            id: `click-${Date.now()}`,
            userId: user.id,
            trackId,
            action: 'play', // Click usually leads to play
            timestamp: new Date(),
            sessionId: `session-${Date.now()}`,
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
            timeOfDay: getTimeOfDay(),
          });
        }
      },

      trackTrackPlay: (sectionId: string, trackId: string) => {
        get().trackSectionView(sectionId);

        const user = useAuthStore.getState().user;
        if (user) {
          get().trackUserBehavior({
            id: `play-${Date.now()}`,
            userId: user.id,
            trackId,
            action: 'play',
            timestamp: new Date(),
            sessionId: `session-${Date.now()}`,
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
            timeOfDay: getTimeOfDay(),
          });
        }
      },

      trackTrackSkip: (sectionId: string, trackId: string) => {
        const user = useAuthStore.getState().user;
        if (user) {
          get().trackUserBehavior({
            id: `skip-${Date.now()}`,
            userId: user.id,
            trackId,
            action: 'skip',
            timestamp: new Date(),
            listenDuration: 15, // Mock skip after 15 seconds
            sessionId: `session-${Date.now()}`,
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
            timeOfDay: getTimeOfDay(),
          });
        }
      },

      trackTrackLike: (sectionId: string, trackId: string) => {
        const user = useAuthStore.getState().user;
        if (user) {
          get().trackUserBehavior({
            id: `like-${Date.now()}`,
            userId: user.id,
            trackId,
            action: 'like',
            timestamp: new Date(),
            sessionId: `session-${Date.now()}`,
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
            timeOfDay: getTimeOfDay(),
          });
        }
      },

      trackTrackShare: (sectionId: string, trackId: string) => {
        const user = useAuthStore.getState().user;
        if (user) {
          get().trackUserBehavior({
            id: `share-${Date.now()}`,
            userId: user.id,
            trackId,
            action: 'share',
            timestamp: new Date(),
            sessionId: `session-${Date.now()}`,
            deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
            timeOfDay: getTimeOfDay(),
          });
        }
      },

      hideSection: (sectionId: string) => {
        const state = get();
        if (!state.homeFeed) return;

        const updatedSections = state.homeFeed.sections.filter(
          section => section.id !== sectionId
        );

        set({
          homeFeed: {
            ...state.homeFeed,
            sections: updatedSections,
          },
        });
      },

      reorderSections: (fromIndex: number, toIndex: number) => {
        const state = get();
        if (!state.homeFeed) return;

        const sections = [...state.homeFeed.sections];
        const [movedSection] = sections.splice(fromIndex, 1);
        if (movedSection) {
          sections.splice(toIndex, 0, movedSection);
        }

        // Update priorities based on new order
        const updatedSections = sections.map((section, index) => ({
          ...section,
          priority: index + 1,
        }));

        set({
          homeFeed: {
            ...state.homeFeed,
            sections: updatedSections,
          },
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "home-feed-store",
    },
  ),
);

// Helper functions
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Auto-initialize when user is available
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state) => {
    if (state.user && state.isAuthenticated) {
      const homeFeedState = useHomeFeedStore.getState();
      if (!homeFeedState.homeFeed && !homeFeedState.isLoading) {
        homeFeedState.loadHomeFeed(state.user.id, false);
      }
    }
  });
}