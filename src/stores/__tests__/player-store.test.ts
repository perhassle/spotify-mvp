import { describe, it, expect, beforeEach } from '@jest/globals';
import { usePlayerStore } from '../player-store';

describe('Player Store', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      volume: 0.5,
      currentTime: 0,
      duration: 0,
      queue: [],
      queueIndex: -1,
      repeat: 'off',
      shuffle: false,
      playbackRate: 1,
      crossfadeEnabled: false,
      crossfadeDuration: 5,
      equalizerEnabled: false,
      equalizerPreset: 'flat',
      spatialAudioEnabled: false,
      audioQuality: 'normal',
    });
  });

  describe('playback controls', () => {
    it('should set current track', () => {
      const track = {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        cover: 'test.jpg',
        audioUrl: 'test.mp3',
      };

      usePlayerStore.getState().setCurrentTrack(track);
      
      expect(usePlayerStore.getState().currentTrack).toEqual(track);
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('should play and pause', () => {
      const { play, pause } = usePlayerStore.getState();
      
      play();
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      
      pause();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('should adjust volume', () => {
      const { setVolume } = usePlayerStore.getState();
      
      setVolume(0.8);
      expect(usePlayerStore.getState().volume).toBe(0.8);
      
      // Should clamp to valid range
      setVolume(1.5);
      expect(usePlayerStore.getState().volume).toBe(1);
      
      setVolume(-0.5);
      expect(usePlayerStore.getState().volume).toBe(0);
    });
  });

  describe('queue management', () => {
    const tracks = [
      { id: '1', title: 'Song 1', artist: 'Artist 1', album: 'Album 1', duration: 180, cover: 'cover1.jpg', audioUrl: 'song1.mp3' },
      { id: '2', title: 'Song 2', artist: 'Artist 2', album: 'Album 2', duration: 200, cover: 'cover2.jpg', audioUrl: 'song2.mp3' },
      { id: '3', title: 'Song 3', artist: 'Artist 3', album: 'Album 3', duration: 220, cover: 'cover3.jpg', audioUrl: 'song3.mp3' },
    ];

    it('should set queue', () => {
      const { setQueue } = usePlayerStore.getState();
      
      setQueue(tracks);
      
      expect(usePlayerStore.getState().queue).toEqual(tracks);
      expect(usePlayerStore.getState().queueIndex).toBe(0);
      expect(usePlayerStore.getState().currentTrack).toEqual(tracks[0]);
    });

    it('should add to queue', () => {
      const { setQueue, addToQueue } = usePlayerStore.getState();
      
      setQueue([tracks[0]]);
      addToQueue(tracks[1]);
      
      expect(usePlayerStore.getState().queue).toHaveLength(2);
      expect(usePlayerStore.getState().queue[1]).toEqual(tracks[1]);
    });

    it('should navigate through queue', () => {
      const { setQueue, skipToNext, skipToPrevious } = usePlayerStore.getState();
      
      setQueue(tracks);
      
      skipToNext();
      expect(usePlayerStore.getState().queueIndex).toBe(1);
      expect(usePlayerStore.getState().currentTrack).toEqual(tracks[1]);
      
      skipToPrevious();
      expect(usePlayerStore.getState().queueIndex).toBe(0);
      expect(usePlayerStore.getState().currentTrack).toEqual(tracks[0]);
    });

    it('should handle shuffle mode', () => {
      const { toggleShuffle } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().shuffle).toBe(false);
      
      toggleShuffle();
      expect(usePlayerStore.getState().shuffle).toBe(true);
      
      toggleShuffle();
      expect(usePlayerStore.getState().shuffle).toBe(false);
    });

    it('should cycle through repeat modes', () => {
      const { toggleRepeat } = usePlayerStore.getState();
      const { repeat: initialRepeat } = usePlayerStore.getState();
      
      expect(initialRepeat).toBe('off');
      
      toggleRepeat();
      expect(usePlayerStore.getState().repeat).toBe('all');
      
      toggleRepeat();
      expect(usePlayerStore.getState().repeat).toBe('one');
      
      toggleRepeat();
      expect(usePlayerStore.getState().repeat).toBe('off');
    });
  });

  describe('audio features', () => {
    it('should toggle crossfade', () => {
      const { toggleCrossfade } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().crossfadeEnabled).toBe(false);
      
      toggleCrossfade();
      expect(usePlayerStore.getState().crossfadeEnabled).toBe(true);
    });

    it('should set crossfade duration', () => {
      const { setCrossfadeDuration } = usePlayerStore.getState();
      
      setCrossfadeDuration(10);
      expect(usePlayerStore.getState().crossfadeDuration).toBe(10);
    });

    it('should toggle equalizer', () => {
      const { toggleEqualizer } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().equalizerEnabled).toBe(false);
      
      toggleEqualizer();
      expect(usePlayerStore.getState().equalizerEnabled).toBe(true);
    });

    it('should set audio quality', () => {
      const { setAudioQuality } = usePlayerStore.getState();
      
      setAudioQuality('high');
      expect(usePlayerStore.getState().audioQuality).toBe('high');
      
      setAudioQuality('lossless');
      expect(usePlayerStore.getState().audioQuality).toBe('lossless');
    });
  });
});