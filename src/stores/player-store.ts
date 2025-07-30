import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PlayerState, Track, RepeatMode, User, MockAd } from "@/types";
import { AdvancedAudioEngine, type AudioEngineConfig, type AudioAnalyzerData } from "@/lib/audio/advanced-audio-engine";
import { skipTracker } from "@/lib/subscription/skip-tracker";
import { adManager } from "@/lib/subscription/ad-manager";
import { audioQualityManager } from "@/lib/subscription/audio-quality-manager";
import { TierManager } from "@/lib/subscription/tier-manager";

interface PlayerActions {
  // Playback Controls
  play: (track?: Track) => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  
  // Volume Controls
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  
  // Queue Management
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  
  // Playback Modes
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  
  // Progress Updates
  updateProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  
  // Context
  setPlaybackContext: (context: any) => void;
  
  // Loading States
  setLoading: (loading: boolean) => void;
  
  // Advanced Audio Features
  setPlaybackRate: (rate: number) => void;
  setCrossfadeDuration: (duration: number) => void;
  toggleEqualizer: () => void;
  setEqualizerPreset: (preset: string) => void;
  setEqualizerBand: (bandIndex: number, gain: number) => void;
  toggleVisualizer: () => void;
  setAudioQuality: (quality: 'low' | 'medium' | 'high' | 'lossless') => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  
  // Skip Management (tier-aware)
  attemptSkip: (user: User | null) => Promise<boolean>;
  getSkipStatus: (user: User | null) => any;
  
  // Ad Management
  checkForAd: (user: User | null, nextTrack: Track) => boolean;
  playAd: (user: User | null) => Promise<MockAd | null>;
  skipCurrentAd: (user: User | null) => boolean;
  completeCurrentAd: (user: User | null) => void;
  getCurrentAd: () => MockAd | null;
  
  // Quality Management
  setOptimalQuality: (user: User | null, track: Track) => void;
  getQualityInfo: (user: User | null) => any;
  
  // Audio Engine
  initializeAudioEngine: () => void;
  getAnalyzerData: () => AudioAnalyzerData | null;
  
  // Reset
  reset: () => void;
}

type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  repeatMode: "off",
  shuffleMode: false,
  isLoading: false,
  // New advanced features
  playbackRate: 1,
  crossfadeDuration: 3,
  isEqualizerEnabled: true,
  equalizerPreset: 'flat',
  isVisualizerEnabled: true,
  audioQuality: 'high' as 'low' | 'medium' | 'high' | 'lossless',
  skipCount: 0,
  maxSkips: 6, // Free users limited to 6 skips per hour
};

// Ad-related state (separate from PlayerState to avoid type conflicts)
interface AdState {
  currentAd: MockAd | null;
  isPlayingAd: boolean;
  adProgress: number;
  canSkipAd: boolean;
  adQueue: MockAd[];
}

// Global audio engine instance
let audioEngine: AdvancedAudioEngine | null = null;
let progressInterval: NodeJS.Timeout | null = null;

// Ad state
const initialAdState: AdState = {
  currentAd: null,
  isPlayingAd: false,
  adProgress: 0,
  canSkipAd: false,
  adQueue: []
};

let adState: AdState = { ...initialAdState };

const usePlayerStore = create<PlayerStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      initializeAudioEngine: () => {
        if (!audioEngine) {
          const config: AudioEngineConfig = {
            crossfadeDuration: get().crossfadeDuration,
            preloadNext: true,
            enableEqualizer: get().isEqualizerEnabled,
            enableVisualizer: get().isVisualizerEnabled,
            audioQuality: get().audioQuality,
          };
          
          audioEngine = new AdvancedAudioEngine(config);
          
          // Set up audio engine callbacks
          audioEngine.onTrackEnd = () => {
            get().nextTrack();
          };
          
          audioEngine.onError = (error) => {
            console.error('Audio engine error:', error);
            set({ isLoading: false, isPlaying: false });
          };
          
          // Start progress tracking
          if (progressInterval) clearInterval(progressInterval);
          progressInterval = setInterval(() => {
            if (audioEngine && get().isPlaying) {
              const currentTime = audioEngine.getCurrentTime();
              const duration = audioEngine.getDuration();
              set({ 
                progress: currentTime,
                duration: duration,
              });
              
              // Update Media Session position
              audioEngine.updatePositionState();
            }
          }, 100);
        }
      },
      
      play: async (track) => {
        const state = get();
        
        if (!audioEngine) {
          get().initializeAudioEngine();
        }
        
        if (track) {
          try {
            set({ isLoading: true });
            await audioEngine!.play(track);
            audioEngine!.setupMediaSession(track);
            
            set({
              currentTrack: track,
              isPlaying: true,
              progress: 0,
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to play track:', error);
            set({ isLoading: false, isPlaying: false });
          }
        } else if (state.currentTrack && audioEngine) {
          // Resume current track
          audioEngine.resume();
          set({ isPlaying: true });
        }
      },
      
      pause: () => {
        if (audioEngine) {
          audioEngine.pause();
        }
        set({ isPlaying: false });
      },
      
      togglePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        if (currentTrack) {
          if (isPlaying) {
            get().pause();
          } else {
            get().play();
          }
        }
      },
      
      nextTrack: async () => {
        const { queue, currentIndex, repeatMode, shuffleMode, crossfadeDuration } = get();
        
        if (queue.length === 0) return;
        
        let nextIndex: number;
        
        if (repeatMode === "track") {
          // Repeat current track
          nextIndex = currentIndex;
        } else if (shuffleMode) {
          // Random next track (avoiding current)
          const availableIndices = queue
            .map((_, index) => index)
            .filter(index => index !== currentIndex);
          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] ?? 0;
        } else {
          // Normal progression
          nextIndex = currentIndex + 1;
          
          if (nextIndex >= queue.length) {
            if (repeatMode === "context") {
              nextIndex = 0; // Loop to beginning
            } else {
              // End of queue
              if (audioEngine) {
                audioEngine.stop();
              }
              set({ isPlaying: false });
              return;
            }
          }
        }
        
        const nextTrack = queue[nextIndex];
        if (!nextTrack) return;

        // Check if an ad should be played before the next track
        // TODO: Get user from auth store
        const user = null as User | null;
        if (user && get().checkForAd(user, nextTrack)) {
          const ad = await get().playAd(user);
          if (ad) {
            // Ad will play, nextTrack will be called again after ad completes
            return;
          }
        }

        // Track the track play for ad frequency calculation
        if (user) {
          adManager.trackTrackPlay(user);
        }

        // Set optimal audio quality based on user tier
        if (user) {
          get().setOptimalQuality(user, nextTrack);
        }
        
        if (audioEngine) {
          try {
            // Use crossfade if enabled and there's a current track playing
            if (crossfadeDuration > 0 && get().isPlaying && TierManager.hasFeatureAccess(user, 'crossfade')) {
              await audioEngine.crossfadeToNext(nextTrack);
            } else {
              await audioEngine.play(nextTrack);
            }
            
            audioEngine.setupMediaSession(nextTrack);
            
            set({
              currentTrack: nextTrack,
              currentIndex: nextIndex,
              progress: 0,
              isPlaying: true,
            });
          } catch (error) {
            console.error('Failed to play next track:', error);
            set({ isLoading: false, isPlaying: false });
          }
        }
      },
      
      previousTrack: () => {
        const { queue, currentIndex, progress } = get();
        
        if (queue.length === 0) return;
        
        // If more than 3 seconds into track, restart current track
        if (progress > 3) {
          set({ progress: 0 });
          return;
        }
        
        // Go to previous track
        const previousIndex = currentIndex - 1;
        
        if (previousIndex < 0) {
          // Go to last track if repeat is on, otherwise stay at first
          const { repeatMode } = get();
          const targetIndex = repeatMode === "context" ? queue.length - 1 : 0;
          const targetTrack = queue[targetIndex];
          
          if (targetTrack) {
            set({
              currentTrack: targetTrack,
              currentIndex: targetIndex,
              progress: 0,
            });
          }
        } else {
          const previousTrack = queue[previousIndex];
          if (previousTrack) {
            set({
              currentTrack: previousTrack,
              currentIndex: previousIndex,
              progress: 0,
            });
          }
        }
      },
      
      seekTo: (time) => {
        if (audioEngine) {
          audioEngine.seekTo(time);
        }
        set({ progress: Math.max(0, Math.min(time, get().duration)) });
      },
      
      setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        if (audioEngine) {
          audioEngine.setVolume(clampedVolume);
        }
        set({ volume: clampedVolume });
      },
      
      mute: () => {
        set({ volume: 0 });
      },
      
      unmute: () => {
        const { volume } = get();
        if (volume === 0) {
          set({ volume: 0.8 });
        }
      },
      
      setQueue: (tracks, startIndex = 0) => {
        const currentTrack = tracks[startIndex];
        set({
          queue: tracks,
          currentIndex: startIndex,
          currentTrack: currentTrack || null,
          progress: 0,
        });
      },
      
      addToQueue: (track) => {
        const { queue } = get();
        set({ queue: [...queue, track] });
      },
      
      removeFromQueue: (index) => {
        const { queue, currentIndex } = get();
        const newQueue = queue.filter((_, i) => i !== index);
        
        let newCurrentIndex = currentIndex;
        if (index < currentIndex) {
          newCurrentIndex = currentIndex - 1;
        } else if (index === currentIndex) {
          // Current track was removed
          const newCurrentTrack = newQueue[newCurrentIndex] || newQueue[0] || null;
          set({
            queue: newQueue,
            currentIndex: newCurrentTrack ? newCurrentIndex : -1,
            currentTrack: newCurrentTrack,
            isPlaying: false,
            progress: 0,
          });
          return;
        }
        
        set({
          queue: newQueue,
          currentIndex: newCurrentIndex >= newQueue.length ? -1 : newCurrentIndex,
        });
      },
      
      clearQueue: () => {
        set({
          queue: [],
          currentIndex: -1,
          currentTrack: null,
          isPlaying: false,
          progress: 0,
        });
      },
      
      setRepeatMode: (mode) => {
        set({ repeatMode: mode });
      },
      
      toggleShuffle: () => {
        set({ shuffleMode: !get().shuffleMode });
      },
      
      updateProgress: (progress) => {
        set({ progress });
      },
      
      setDuration: (duration) => {
        set({ duration });
      },
      
      setPlaybackContext: () => {
        // This could be expanded to store playback context
        // For now, just acknowledge the context change
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      // Queue reordering
      reorderQueue: (fromIndex, toIndex) => {
        const { queue } = get();
        const newQueue = [...queue];
        const [movedTrack] = newQueue.splice(fromIndex, 1);
        if (movedTrack) {
          newQueue.splice(toIndex, 0, movedTrack);
        }
        
        // Update current index if needed
        let newCurrentIndex = get().currentIndex;
        if (fromIndex === newCurrentIndex) {
          newCurrentIndex = toIndex;
        } else if (fromIndex < newCurrentIndex && toIndex >= newCurrentIndex) {
          newCurrentIndex--;
        } else if (fromIndex > newCurrentIndex && toIndex <= newCurrentIndex) {
          newCurrentIndex++;
        }
        
        set({ queue: newQueue, currentIndex: newCurrentIndex });
      },
      
      // Advanced Audio Features
      setPlaybackRate: (rate) => {
        const clampedRate = Math.max(0.25, Math.min(4, rate));
        if (audioEngine) {
          audioEngine.setPlaybackRate(clampedRate);
        }
        set({ playbackRate: clampedRate });
      },
      
      setCrossfadeDuration: (duration) => {
        const clampedDuration = Math.max(0, Math.min(12, duration));
        if (audioEngine) {
          audioEngine.updateConfig({ crossfadeDuration: clampedDuration });
        }
        set({ crossfadeDuration: clampedDuration });
      },
      
      toggleEqualizer: () => {
        const newEnabled = !get().isEqualizerEnabled;
        if (audioEngine) {
          audioEngine.updateConfig({ enableEqualizer: newEnabled });
        }
        set({ isEqualizerEnabled: newEnabled });
      },
      
      setEqualizerPreset: (preset) => {
        if (audioEngine) {
          audioEngine.setEqualizerPreset(preset as any);
        }
        set({ equalizerPreset: preset });
      },
      
      setEqualizerBand: (bandIndex, gain) => {
        if (audioEngine) {
          audioEngine.setEqualizerBand(bandIndex, gain);
        }
      },
      
      toggleVisualizer: () => {
        const newEnabled = !get().isVisualizerEnabled;
        if (audioEngine) {
          audioEngine.updateConfig({ enableVisualizer: newEnabled });
        }
        set({ isVisualizerEnabled: newEnabled });
      },
      
      setAudioQuality: (quality) => {
        if (audioEngine) {
          audioEngine.updateConfig({ audioQuality: quality });
        }
        set({ audioQuality: quality });
      },
      
      skipForward: (seconds = 15) => {
        const currentProgress = get().progress;
        const duration = get().duration;
        const newTime = Math.min(currentProgress + seconds, duration);
        get().seekTo(newTime);
      },
      
      skipBackward: (seconds = 15) => {
        const currentProgress = get().progress;
        const newTime = Math.max(currentProgress - seconds, 0);
        get().seekTo(newTime);
      },
      
      // Skip Management (tier-aware)
      attemptSkip: async (user: User | null) => {
        const skipResult = skipTracker.attemptSkip(user!);
        if (skipResult.success) {
          await get().nextTrack();
          return true;
        }
        return false;
      },
      
      getSkipStatus: (user: User | null) => {
        return skipTracker.getSkipStatus(user);
      },
      
      // Ad Management
      checkForAd: (user: User | null, nextTrack: Track) => {
        return adManager.shouldPlayAd(user, nextTrack);
      },
      
      playAd: async (user: User | null) => {
        if (!user) return null;
        
        const ad = adManager.getNextAd(user);
        if (!ad) return null;
        
        // Update ad state
        adState.currentAd = ad;
        adState.isPlayingAd = true;
        adState.adProgress = 0;
        adState.canSkipAd = ad.skipable && (ad.skipableAfter || 0) === 0;
        
        try {
          set({ isLoading: true });
          
          // Play ad audio (mock implementation)
          if (audioEngine) {
            // In a real implementation, this would play the ad audio
            // For now, we'll simulate ad playback
            console.log(`Playing ad: ${ad.title} by ${ad.advertiser}`);
            
            // Simulate ad duration
            setTimeout(() => {
              get().completeCurrentAd(user);
            }, ad.duration * 1000);
          }
          
          adManager.startAdPlayback(ad);
          set({ 
            isLoading: false,
            isPlaying: true // Ad is playing
          });
          
          return ad;
        } catch (error) {
          console.error('Failed to play ad:', error);
          adState = { ...initialAdState };
          set({ isLoading: false });
          return null;
        }
      },
      
      skipCurrentAd: (user: User | null) => {
        if (!user || !adState.currentAd || !adState.canSkipAd) {
          return false;
        }
        
        const success = adManager.skipAd(user);
        if (success) {
          adState = { ...initialAdState };
          // Continue to next track
          get().nextTrack();
        }
        return success;
      },
      
      completeCurrentAd: (user: User | null) => {
        if (!user || !adState.currentAd) return;
        
        adManager.completeAd(user);
        adState = { ...initialAdState };
        
        // Continue to next track after ad
        get().nextTrack();
      },
      
      getCurrentAd: () => {
        return adState.currentAd;
      },
      
      // Quality Management
      setOptimalQuality: (user: User | null, track: Track) => {
        if (!user) return;
        
        const qualityInfo = audioQualityManager.getOptimalQuality(user, track);
        
        // Update audio engine quality
        if (audioEngine) {
          audioEngine.updateConfig({ 
            audioQuality: qualityInfo.quality as 'low' | 'medium' | 'high' | 'lossless'
          });
        }
        
        set({ audioQuality: qualityInfo.quality as 'low' | 'medium' | 'high' | 'lossless' });
      },
      
      getQualityInfo: (user: User | null) => {
        if (!user) return null;
        
        const currentTrack = get().currentTrack;
        if (!currentTrack) return null;
        
        return audioQualityManager.getOptimalQuality(user, currentTrack);
      },
      
      // Audio Engine
      getAnalyzerData: () => {
        // This will be called from visualizer components
        return null; // Analyzer data is handled via callback
      },
      
      reset: () => {
        if (audioEngine) {
          audioEngine.dispose();
          audioEngine = null;
        }
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        set(initialState);
      },
    }),
    {
      name: "player-store",
    },
  ),
);

// Export both named and default exports for compatibility
export { usePlayerStore };
export default usePlayerStore;