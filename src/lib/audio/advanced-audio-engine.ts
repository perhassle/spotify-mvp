import type { Track } from "@/types";

export interface AudioEngineConfig {
  crossfadeDuration: number; // in seconds
  preloadNext: boolean;
  enableEqualizer: boolean;
  enableVisualizer: boolean;
  audioQuality: 'low' | 'medium' | 'high' | 'lossless';
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  Q: number;
}

export interface AudioAnalyzerData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  rms: number;
  peak: number;
}

export class AdvancedAudioEngine {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private crossfadeGainNode: GainNode | null = null;
  private nextGainNode: GainNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private equalizerNodes: BiquadFilterNode[] = [];
  private compressorNode: DynamicsCompressorNode | null = null;
  
  private currentTrack: Track | null = null;
  private nextTrack: Track | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
  
  private config: AudioEngineConfig = {
    crossfadeDuration: 3,
    preloadNext: true,
    enableEqualizer: true,
    enableVisualizer: true,
    audioQuality: 'high'
  };
  
  private playbackStartTime: number = 0;
  private pauseTime: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1;
  private crossfadeTimeout: NodeJS.Timeout | null = null;
  
  // Event callbacks
  public onTrackEnd?: () => void;
  public onLoadProgress?: (progress: number) => void;
  public onAnalyzerData?: (data: AudioAnalyzerData) => void;
  public onError?: (error: Error) => void;

  constructor(config?: Partial<AudioEngineConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.setupAudioGraph();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      this.onError?.(new Error('Failed to initialize audio system'));
    }
  }

  private setupAudioGraph(): void {
    if (!this.audioContext) return;

    // Create main gain node
    this.gainNode = this.audioContext.createGain();
    
    // Create crossfade gain node
    this.crossfadeGainNode = this.audioContext.createGain();
    this.nextGainNode = this.audioContext.createGain();
    this.nextGainNode.gain.value = 0;
    
    // Create analyzer node for visualizer
    if (this.config.enableVisualizer) {
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.analyzerNode.smoothingTimeConstant = 0.8;
    }
    
    // Create equalizer nodes
    if (this.config.enableEqualizer) {
      this.setupEqualizer();
    }
    
    // Create compressor
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.knee.value = 30;
    this.compressorNode.ratio.value = 12;
    this.compressorNode.attack.value = 0.01;
    this.compressorNode.release.value = 0.25;
    
    // Connect audio graph
    this.connectAudioGraph();
  }

  private setupEqualizer(): void {
    if (!this.audioContext) return;

    // 10-band equalizer frequencies (Hz)
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    
    this.equalizerNodes = frequencies.map((frequency, index) => {
      const filter = this.audioContext!.createBiquadFilter();
      
      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === frequencies.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1;
      }
      
      filter.frequency.value = frequency;
      filter.gain.value = 0; // neutral
      
      return filter;
    });
  }

  private connectAudioGraph(): void {
    if (!this.audioContext || !this.gainNode) return;

    let currentNode: AudioNode = this.gainNode;
    
    // Connect crossfade nodes
    this.crossfadeGainNode?.connect(currentNode);
    this.nextGainNode?.connect(currentNode);
    
    // Connect equalizer
    if (this.equalizerNodes.length > 0 && this.equalizerNodes[0]) {
      currentNode.connect(this.equalizerNodes[0]);
      for (let i = 0; i < this.equalizerNodes.length - 1; i++) {
        const current = this.equalizerNodes[i];
        const next = this.equalizerNodes[i + 1];
        if (current && next) {
          current.connect(next);
        }
      }
      const lastNode = this.equalizerNodes[this.equalizerNodes.length - 1];
      if (lastNode) {
        currentNode = lastNode;
      }
    }
    
    // Connect compressor
    if (this.compressorNode) {
      currentNode.connect(this.compressorNode);
      currentNode = this.compressorNode;
    }
    
    // Connect analyzer
    if (this.analyzerNode) {
      currentNode.connect(this.analyzerNode);
      this.analyzerNode.connect(this.audioContext.destination);
    } else {
      currentNode.connect(this.audioContext.destination);
    }
  }

  public async loadTrack(track: Track): Promise<void> {
    if (!track.streamUrl) {
      throw new Error('Track has no stream URL');
    }

    if (this.audioBuffers.has(track.id)) {
      return; // Already loaded
    }

    if (this.loadingPromises.has(track.id)) {
      await this.loadingPromises.get(track.id);
      return;
    }

    const loadPromise = this.fetchAndDecodeAudio(track.streamUrl, track.id);
    this.loadingPromises.set(track.id, loadPromise);

    try {
      const buffer = await loadPromise;
      this.audioBuffers.set(track.id, buffer);
      this.loadingPromises.delete(track.id);
    } catch (error) {
      this.loadingPromises.delete(track.id);
      throw error;
    }
  }

  private async fetchAndDecodeAudio(url: string, trackId: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio for track ${trackId}:`, error);
      throw new Error(`Failed to load audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async play(track: Track): Promise<void> {
    try {
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Stop current playback
      this.stop();

      // Load track if not already loaded
      await this.loadTrack(track);

      const buffer = this.audioBuffers.get(track.id);
      if (!buffer) {
        throw new Error('Failed to load audio buffer');
      }

      // Create new audio source
      this.currentSource = this.audioContext!.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.playbackRate.value = this.playbackRate;

      // Connect to crossfade gain node
      this.currentSource.connect(this.crossfadeGainNode!);

      // Set up track end handler
      this.currentSource.onended = () => {
        if (this.isPlaying) {
          this.onTrackEnd?.();
        }
      };

      // Start playback
      this.currentSource.start(0, this.pauseTime);
      this.playbackStartTime = this.audioContext!.currentTime - this.pauseTime;
      this.isPlaying = true;
      this.currentTrack = track;
      this.pauseTime = 0;

      // Preload next track if enabled
      if (this.config.preloadNext && this.nextTrack) {
        this.loadTrack(this.nextTrack).catch(console.warn);
      }

      // Start analyzer if enabled
      if (this.config.enableVisualizer) {
        this.startAnalyzer();
      }

    } catch (error) {
      console.error('Failed to play track:', error);
      this.onError?.(error instanceof Error ? error : new Error('Unknown playback error'));
    }
  }

  public pause(): void {
    if (this.currentSource && this.isPlaying) {
      this.pauseTime = this.getCurrentTime();
      this.currentSource.stop();
      this.currentSource = null;
      this.isPlaying = false;
    }
  }

  public resume(): void {
    if (this.currentTrack && !this.isPlaying) {
      this.play(this.currentTrack);
    }
  }

  public stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = null;
    }
    
    if (this.nextSource) {
      this.nextSource.stop();
      this.nextSource.disconnect();
      this.nextSource = null;
    }

    if (this.crossfadeTimeout) {
      clearTimeout(this.crossfadeTimeout);
      this.crossfadeTimeout = null;
    }

    this.isPlaying = false;
    this.pauseTime = 0;
    this.playbackStartTime = 0;
  }

  public setVolume(volume: number): void {
    if (this.gainNode) {
      // Apply smooth volume changes to avoid clicks
      const now = this.audioContext!.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), now, 0.01);
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(4, rate));
    if (this.currentSource) {
      this.currentSource.playbackRate.value = this.playbackRate;
    }
  }

  public seekTo(time: number): void {
    if (this.currentTrack && this.isPlaying) {
      this.pauseTime = Math.max(0, time);
      this.play(this.currentTrack);
    } else {
      this.pauseTime = Math.max(0, time);
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext) return this.pauseTime;
    return (this.audioContext.currentTime - this.playbackStartTime) * this.playbackRate;
  }

  public getDuration(): number {
    if (!this.currentTrack) return 0;
    const buffer = this.audioBuffers.get(this.currentTrack.id);
    return buffer ? buffer.duration : this.currentTrack.duration;
  }

  // Crossfade to next track
  public async crossfadeToNext(nextTrack: Track): Promise<void> {
    if (!this.audioContext || !this.currentSource) return;

    try {
      await this.loadTrack(nextTrack);
      const buffer = this.audioBuffers.get(nextTrack.id);
      if (!buffer) throw new Error('Failed to load next track');

      // Create next source
      this.nextSource = this.audioContext.createBufferSource();
      this.nextSource.buffer = buffer;
      this.nextSource.playbackRate.value = this.playbackRate;
      this.nextSource.connect(this.nextGainNode!);

      // Start next track
      this.nextSource.start();

      // Crossfade
      const fadeTime = this.config.crossfadeDuration;
      const now = this.audioContext.currentTime;

      // Fade out current track
      this.crossfadeGainNode!.gain.setTargetAtTime(0, now, fadeTime / 3);
      
      // Fade in next track
      this.nextGainNode!.gain.setTargetAtTime(1, now, fadeTime / 3);

      // Switch tracks after crossfade
      this.crossfadeTimeout = setTimeout(() => {
        this.currentSource?.stop();
        this.currentSource = this.nextSource;
        this.nextSource = null;
        this.currentTrack = nextTrack;

        // Reset gain nodes
        this.crossfadeGainNode!.gain.value = 1;
        this.nextGainNode!.gain.value = 0;
      }, fadeTime * 1000);

    } catch (error) {
      console.error('Crossfade failed:', error);
      // Fallback to regular track change
      await this.play(nextTrack);
    }
  }

  // Equalizer controls
  public setEqualizerBand(bandIndex: number, gain: number): void {
    if (bandIndex >= 0 && bandIndex < this.equalizerNodes.length) {
      const filter = this.equalizerNodes[bandIndex];
      const clampedGain = Math.max(-12, Math.min(12, gain));
      
      if (this.audioContext && filter) {
        const now = this.audioContext.currentTime;
        filter.gain.cancelScheduledValues(now);
        filter.gain.setTargetAtTime(clampedGain, now, 0.01);
      }
    }
  }

  public setEqualizerPreset(preset: 'flat' | 'rock' | 'pop' | 'jazz' | 'classical' | 'bass' | 'treble'): void {
    const presets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rock: [3, 2, -1, -1, -1, 1, 2, 3, 3, 3],
      pop: [1, 2, 3, 2, 0, -1, -2, -1, 1, 2],
      jazz: [2, 1, 0, 1, -1, -1, 0, 1, 2, 3],
      classical: [3, 2, 1, 0, -1, -1, 0, 1, 2, 3],
      bass: [6, 4, 2, 1, 0, -1, -2, -3, -3, -3],
      treble: [-3, -3, -2, -1, 0, 1, 2, 4, 6, 8]
    };

    const gains = presets[preset];
    gains.forEach((gain, index) => {
      this.setEqualizerBand(index, gain);
    });
  }

  // Analyzer for visualizer
  private startAnalyzer(): void {
    if (!this.analyzerNode || !this.config.enableVisualizer) return;

    const bufferLength = this.analyzerNode.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    const updateAnalyzer = () => {
      if (!this.isPlaying || !this.analyzerNode) return;

      this.analyzerNode.getByteFrequencyData(frequencyData);
      this.analyzerNode.getByteTimeDomainData(timeDomainData);

      // Calculate RMS and peak
      let rms = 0;
      let peak = 0;
      
      for (let i = 0; i < timeDomainData.length; i++) {
        const sample = timeDomainData[i];
        if (sample !== undefined) {
          const value = (sample - 128) / 128;
          rms += value * value;
          peak = Math.max(peak, Math.abs(value));
        }
      }
      
      rms = Math.sqrt(rms / timeDomainData.length);

      this.onAnalyzerData?.({
        frequencyData: frequencyData.slice(),
        timeDomainData: timeDomainData.slice(),
        rms,
        peak
      });

      requestAnimationFrame(updateAnalyzer);
    };

    updateAnalyzer();
  }

  // Configuration
  public updateConfig(newConfig: Partial<AudioEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): AudioEngineConfig {
    return { ...this.config };
  }

  // Cleanup
  public dispose(): void {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffers.clear();
    this.loadingPromises.clear();
    
    // Clear all nodes
    this.gainNode = null;
    this.crossfadeGainNode = null;
    this.nextGainNode = null;
    this.analyzerNode = null;
    this.equalizerNodes = [];
    this.compressorNode = null;
  }

  // Media Session API integration
  public setupMediaSession(track: Track): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist.name,
        album: track.album.title,
        artwork: track.imageUrl ? [
          { src: track.imageUrl, sizes: '300x300', type: 'image/jpeg' }
        ] : undefined
      });

      navigator.mediaSession.setActionHandler('play', () => {
        this.resume();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        // This will be handled by the player store
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        // This will be handled by the player store
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.seekTo(details.seekTime);
        }
      });
    }
  }

  // Update position state for Media Session
  public updatePositionState(): void {
    if ('mediaSession' in navigator && this.currentTrack) {
      navigator.mediaSession.setPositionState({
        duration: this.getDuration(),
        playbackRate: this.playbackRate,
        position: this.getCurrentTime()
      });
    }
  }
}