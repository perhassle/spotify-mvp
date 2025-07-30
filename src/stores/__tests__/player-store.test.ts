import { describe, it, expect, beforeEach } from '@jest/globals';
import { usePlayerStore } from '../player-store';

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
      isLoading: false,
      playbackRate: 1,
      crossfadeDuration: 5,
      isEqualizerEnabled: false,
      equalizerPreset: 'flat',
      isVisualizerEnabled: false,
      audioQuality: 'high',
      skipCount: 0,
      maxSkips: 6,
    });
  });

  describe('playback controls', () => {
    it('should set current track', () => {
      const track = {
        id: '1',
        title: 'Test Song',
        artist: {
          id: 'artist-1',
          name: 'Test Artist',
          genres: ['rock'],
          followers: 1000,
          imageUrl: 'test-artist.jpg',
          isVerified: true,
          popularity: 80
        },
        album: {
          id: 'album-1',
          title: 'Test Album',
          artist: {
            id: 'artist-1',
            name: 'Test Artist',
            genres: ['rock'],
            followers: 1000,
            imageUrl: 'test-artist.jpg',
            isVerified: true,
            popularity: 80
          },
          releaseDate: new Date('2023-01-01'),
          genres: ['rock'],
          totalTracks: 10,
          imageUrl: 'test-album.jpg',
          type: 'album' as const
        },
        duration: 180,
        isExplicit: false,
        popularity: 80,
        genres: ['rock'],
        releaseDate: new Date('2023-01-01'),
        imageUrl: 'test.jpg',
        streamUrl: 'test.mp3',
      };

      // Since there's no setCurrentTrack method, we'll play the track instead
      usePlayerStore.getState().play(track);
      
      expect(usePlayerStore.getState().currentTrack).toEqual(track);
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
      { 
        id: '1', 
        title: 'Song 1', 
        artist: {
          id: 'artist-1',
          name: 'Artist 1',
          genres: ['rock'],
          followers: 1000,
          imageUrl: 'artist1.jpg',
          isVerified: true,
          popularity: 80
        },
        album: {
          id: 'album-1',
          title: 'Album 1',
          artist: {
            id: 'artist-1',
            name: 'Artist 1',
            genres: ['rock'],
            followers: 1000,
            imageUrl: 'artist1.jpg',
            isVerified: true,
            popularity: 80
          },
          releaseDate: new Date('2023-01-01'),
          genres: ['rock'],
          totalTracks: 10,
          imageUrl: 'album1.jpg',
          type: 'album' as const
        },
        duration: 180, 
        isExplicit: false,
        popularity: 80,
        genres: ['rock'],
        releaseDate: new Date('2023-01-01'),
        imageUrl: 'cover1.jpg', 
        streamUrl: 'song1.mp3' 
      },
      { 
        id: '2', 
        title: 'Song 2', 
        artist: {
          id: 'artist-2',
          name: 'Artist 2',
          genres: ['pop'],
          followers: 2000,
          imageUrl: 'artist2.jpg',
          isVerified: false,
          popularity: 75
        },
        album: {
          id: 'album-2',
          title: 'Album 2',
          artist: {
            id: 'artist-2',
            name: 'Artist 2',
            genres: ['pop'],
            followers: 2000,
            imageUrl: 'artist2.jpg',
            isVerified: false,
            popularity: 75
          },
          releaseDate: new Date('2023-02-01'),
          genres: ['pop'],
          totalTracks: 12,
          imageUrl: 'album2.jpg',
          type: 'album' as const
        },
        duration: 200, 
        isExplicit: false,
        popularity: 75,
        genres: ['pop'],
        releaseDate: new Date('2023-02-01'),
        imageUrl: 'cover2.jpg', 
        streamUrl: 'song2.mp3' 
      },
      { 
        id: '3', 
        title: 'Song 3', 
        artist: {
          id: 'artist-3',
          name: 'Artist 3',
          genres: ['jazz'],
          followers: 1500,
          imageUrl: 'artist3.jpg',
          isVerified: true,
          popularity: 70
        },
        album: {
          id: 'album-3',
          title: 'Album 3',
          artist: {
            id: 'artist-3',
            name: 'Artist 3',
            genres: ['jazz'],
            followers: 1500,
            imageUrl: 'artist3.jpg',
            isVerified: true,
            popularity: 70
          },
          releaseDate: new Date('2023-03-01'),
          genres: ['jazz'],
          totalTracks: 8,
          imageUrl: 'album3.jpg',
          type: 'album' as const
        },
        duration: 220, 
        isExplicit: false,
        popularity: 70,
        genres: ['jazz'],
        releaseDate: new Date('2023-03-01'),
        imageUrl: 'cover3.jpg', 
        streamUrl: 'song3.mp3' 
      },
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
      
      setQueue([tracks[0]!]);
      addToQueue(tracks[1]!);
      
      expect(usePlayerStore.getState().queue).toHaveLength(2);
      expect(usePlayerStore.getState().queue[1]).toEqual(tracks[1]);
    });

    it('should navigate through queue', () => {
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

    it('should cycle through repeat modes', () => {
      const { setRepeatMode } = usePlayerStore.getState();
      const { repeatMode: initialRepeat } = usePlayerStore.getState();
      
      expect(initialRepeat).toBe('off');
      
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