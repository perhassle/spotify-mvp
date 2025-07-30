import { describe, it, expect, beforeEach } from '@jest/globals';
import { usePlayerStore } from '../player-store';
import type { Track, Artist, Album } from '@/types';

// Mock the advanced audio engine
jest.mock('@/lib/audio/advanced-audio-engine', () => ({
  AdvancedAudioEngine: jest.fn().mockImplementation(() => ({
    initializeAudioContext: jest.fn(),
    loadTrack: jest.fn().mockResolvedValue(undefined),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    setVolume: jest.fn(),
    setCrossfade: jest.fn(),
    setEqualizer: jest.fn(),
    toggleSpatialAudio: jest.fn(),
    getAudioData: jest.fn().mockReturnValue({ frequencyData: new Uint8Array(128), waveformData: new Uint8Array(128) }),
    getCurrentTime: jest.fn().mockReturnValue(0),
    getDuration: jest.fn().mockReturnValue(180),
    setupMediaSession: jest.fn(),
    resume: jest.fn(),
    updateConfig: jest.fn(),
    isPlaying: false,
  }))
}));

// Mock data helpers
const createMockArtist = (id: string, name: string): Artist => ({
  id,
  name,
  genres: ['pop'],
  followers: 1000,
  isVerified: true,
  popularity: 80
});

const createMockAlbum = (id: string, title: string, artist: Artist): Album => ({
  id,
  title,
  artist,
  releaseDate: new Date(),
  totalTracks: 10,
  genres: ['pop'],
  type: 'album'
});

const createMockTrack = (id: string, title: string, artist: Artist, album: Album): Track => ({
  id,
  title,
  artist,
  album,
  duration: 180,
  isExplicit: false,
  popularity: 75,
  genres: ['pop'],
  releaseDate: new Date(),
  imageUrl: `cover${id}.jpg`,
  streamUrl: `song${id}.mp3`
});

describe('Player Store', () => {
  beforeEach(() => {
    // Reset store before each test
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      volume: 0.5,
      progress: 0,
      duration: 0,
      queue: [],
      currentIndex: -1,
      repeatMode: 'off',
      shuffleMode: false,
      playbackRate: 1,
      crossfadeDuration: 3,
      isEqualizerEnabled: false,
      equalizerPreset: 'flat',
      isVisualizerEnabled: false,
      audioQuality: 'high',
      skipCount: 0,
      maxSkips: 6,
      isLoading: false
    });
  });

  describe('playback controls', () => {
    it('should play a track', async () => {
      const mockArtist = createMockArtist('artist1', 'Test Artist');
      const mockAlbum = createMockAlbum('album1', 'Test Album', mockArtist);
      const track = createMockTrack('1', 'Test Song', mockArtist, mockAlbum);

      await usePlayerStore.getState().play(track);
      
      expect(usePlayerStore.getState().currentTrack).toEqual(track);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it.skip('should play and pause', () => {
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
    const mockArtist = createMockArtist('artist1', 'Artist 1');
    const mockAlbum = createMockAlbum('album1', 'Album 1', mockArtist);
    
    const tracks: Track[] = [
      createMockTrack('1', 'Song 1', mockArtist, mockAlbum),
      createMockTrack('2', 'Song 2', mockArtist, mockAlbum),
      createMockTrack('3', 'Song 3', mockArtist, mockAlbum)
    ];

    it('should set queue', () => {
      const { setQueue } = usePlayerStore.getState();
      
      setQueue(tracks);
      
      expect(usePlayerStore.getState().queue).toEqual(tracks);
      expect(usePlayerStore.getState().currentIndex).toBe(0);
      expect(usePlayerStore.getState().currentTrack).toEqual(tracks[0]);
    });

    it('should add to queue', () => {
      const { setQueue, addToQueue } = usePlayerStore.getState();
      
      const firstTrack = tracks[0];
      if (firstTrack) {
        setQueue([firstTrack]);
      }
      const trackToAdd = tracks[1];
      if (trackToAdd) {
        addToQueue(trackToAdd);
        expect(usePlayerStore.getState().queue).toHaveLength(2);
        expect(usePlayerStore.getState().queue[1]).toEqual(trackToAdd);
      }
    });

    it.skip('should navigate through queue', () => {
      const { setQueue, nextTrack, previousTrack } = usePlayerStore.getState();
      
      setQueue(tracks);
      
      nextTrack();
      expect(usePlayerStore.getState().currentIndex).toBe(1);
      expect(usePlayerStore.getState().currentTrack).toEqual(tracks[1]);
      
      previousTrack();
      expect(usePlayerStore.getState().currentIndex).toBe(0);
      expect(usePlayerStore.getState().currentTrack).toEqual(tracks[0]);
    });

    it('should handle shuffle mode', () => {
      const { toggleShuffle } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().shuffleMode).toBe(false);
      
      toggleShuffle();
      expect(usePlayerStore.getState().shuffleMode).toBe(true);
      
      toggleShuffle();
      expect(usePlayerStore.getState().shuffleMode).toBe(false);
    });

    it('should set repeat mode', () => {
      const { setRepeatMode } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().repeatMode).toBe('off');
      
      setRepeatMode('context');
      expect(usePlayerStore.getState().repeatMode).toBe('context');
      
      setRepeatMode('track');
      expect(usePlayerStore.getState().repeatMode).toBe('track');
      
      setRepeatMode('off');
      expect(usePlayerStore.getState().repeatMode).toBe('off');
    });
  });

  describe('audio features', () => {
    it('should set crossfade duration', () => {
      const { setCrossfadeDuration } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().crossfadeDuration).toBe(3);
      
      setCrossfadeDuration(10);
      expect(usePlayerStore.getState().crossfadeDuration).toBe(10);
    });

    it('should toggle equalizer', () => {
      const { toggleEqualizer } = usePlayerStore.getState();
      
      expect(usePlayerStore.getState().isEqualizerEnabled).toBe(false);
      
      toggleEqualizer();
      expect(usePlayerStore.getState().isEqualizerEnabled).toBe(true);
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