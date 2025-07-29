import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PlayerState, Track, RepeatMode, PlaybackContext } from "@/types";

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
  
  // Playback Modes
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  
  // Progress Updates
  updateProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  
  // Context
  setPlaybackContext: (context: PlaybackContext) => void;
  
  // Loading States
  setLoading: (loading: boolean) => void;
  
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
};

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      play: (track) => {
        const state = get();
        if (track) {
          // Play specific track
          set({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            isLoading: false,
          });
        } else if (state.currentTrack) {
          // Resume current track
          set({ isPlaying: true });
        }
      },
      
      pause: () => {
        set({ isPlaying: false });
      },
      
      togglePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        if (currentTrack) {
          set({ isPlaying: !isPlaying });
        }
      },
      
      nextTrack: () => {
        const { queue, currentIndex, repeatMode, shuffleMode } = get();
        
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
              set({ isPlaying: false });
              return;
            }
          }
        }
        
        const nextTrack = queue[nextIndex];
        if (nextTrack) {
          set({
            currentTrack: nextTrack,
            currentIndex: nextIndex,
            progress: 0,
            isPlaying: true,
          });
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
        set({ progress: Math.max(0, Math.min(time, get().duration)) });
      },
      
      setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
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
      
      setPlaybackContext: (_context) => {
        // This could be expanded to store playback context
        // For now, just acknowledge the context change
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "player-store",
    },
  ),
);