"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlayIcon, QueueListIcon, ArrowsRightLeftIcon as ShuffleIcon } from "@heroicons/react/24/outline";
import type { Track } from "@/types";

// Mock tracks for demo
const DEMO_TRACKS: Track[] = [
  {
    id: "track-1",
    title: "Anti-Hero",
    artist: {
      id: "artist-1",
      name: "Taylor Swift",
      bio: "American singer-songwriter",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face",
      genres: ["Pop", "Country", "Folk"],
      followers: 89500000,
      isVerified: true,
      popularity: 95,
    },
    album: {
      id: "album-1",
      title: "Midnights",
      artist: {
        id: "artist-1",
        name: "Taylor Swift",
        bio: "American singer-songwriter",
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face",
        genres: ["Pop", "Country", "Folk"],
        followers: 89500000,
        isVerified: true,
        popularity: 95,
      },
      releaseDate: new Date("2022-10-21"),
      totalTracks: 13,
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      genres: ["Pop", "Synth Pop"],
      type: "album",
    },
    duration: 30, // 30 seconds for demo
    previewUrl: "/audio/track-1.wav",
    streamUrl: "/audio/track-1.wav",
    isExplicit: false,
    popularity: 95,
    trackNumber: 3,
    genres: ["Pop", "Synth Pop"],
    releaseDate: new Date("2022-10-21"),
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  },
  {
    id: "track-2",
    title: "Lavender Haze",
    artist: {
      id: "artist-1",
      name: "Taylor Swift",
      bio: "American singer-songwriter",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face",
      genres: ["Pop", "Country", "Folk"],
      followers: 89500000,
      isVerified: true,
      popularity: 95,
    },
    album: {
      id: "album-1",
      title: "Midnights",
      artist: {
        id: "artist-1",
        name: "Taylor Swift",
        bio: "American singer-songwriter",
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face",
        genres: ["Pop", "Country", "Folk"],
        followers: 89500000,
        isVerified: true,
        popularity: 95,
      },
      releaseDate: new Date("2022-10-21"),
      totalTracks: 13,
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      genres: ["Pop", "Synth Pop"],
      type: "album",
    },
    duration: 30, // 30 seconds for demo
    previewUrl: "/audio/track-2.wav",
    streamUrl: "/audio/track-2.wav",
    isExplicit: false,
    popularity: 92,
    trackNumber: 1,
    genres: ["Pop", "Synth Pop"],
    releaseDate: new Date("2022-10-21"),
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  },
  {
    id: "track-3",
    title: "Blinding Lights",
    artist: {
      id: "artist-2",
      name: "The Weeknd",
      bio: "Canadian singer, songwriter, and record producer",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face",
      genres: ["R&B", "Pop", "Alternative R&B"],
      followers: 65200000,
      isVerified: true,
      popularity: 92,
    },
    album: {
      id: "album-2",
      title: "After Hours",
      artist: {
        id: "artist-2",
        name: "The Weeknd",
        bio: "Canadian singer, songwriter, and record producer",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face",
        genres: ["R&B", "Pop", "Alternative R&B"],
        followers: 65200000,
        isVerified: true,
        popularity: 92,
      },
      releaseDate: new Date("2020-03-20"),
      totalTracks: 14,
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      genres: ["R&B", "Synth Pop"],
      type: "album",
    },
    duration: 30, // 30 seconds for demo
    previewUrl: "/audio/track-3.wav",
    streamUrl: "/audio/track-3.wav",
    isExplicit: false,
    popularity: 98,
    trackNumber: 4,
    genres: ["R&B", "Synth Pop"],
    releaseDate: new Date("2020-03-20"),
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
  },
  {
    id: "track-4",
    title: "Good 4 U",
    artist: {
      id: "artist-3",
      name: "Olivia Rodrigo",
      bio: "American singer-songwriter and actress",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face",
      genres: ["Pop", "Alternative Rock", "Pop Rock"],
      followers: 28500000,
      isVerified: true,
      popularity: 86,
    },
    album: {
      id: "album-3",
      title: "SOUR",
      artist: {
        id: "artist-3",
        name: "Olivia Rodrigo",
        bio: "American singer-songwriter and actress",
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=face",
        genres: ["Pop", "Alternative Rock", "Pop Rock"],
        followers: 28500000,
        isVerified: true,
        popularity: 86,
      },
      releaseDate: new Date("2021-05-21"),
      totalTracks: 11,
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      genres: ["Pop", "Alternative Rock"],
      type: "album",
    },
    duration: 30, // 30 seconds for demo
    previewUrl: "/audio/track-4.wav",
    streamUrl: "/audio/track-4.wav",
    isExplicit: false,
    popularity: 94,
    trackNumber: 2,
    genres: ["Pop", "Alternative Rock"],
    releaseDate: new Date("2021-05-21"),
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  },
  {
    id: "track-5",
    title: "Heat Waves",
    artist: {
      id: "artist-4",
      name: "Glass Animals",
      bio: "English indie rock band",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face",
      genres: ["Indie Rock", "Alternative Rock", "Psychedelic Pop"],
      followers: 12500000,
      isVerified: true,
      popularity: 88,
    },
    album: {
      id: "album-4",
      title: "Dreamland",
      artist: {
        id: "artist-4",
        name: "Glass Animals",
        bio: "English indie rock band",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face",
        genres: ["Indie Rock", "Alternative Rock", "Psychedelic Pop"],
        followers: 12500000,
        isVerified: true,
        popularity: 88,
      },
      releaseDate: new Date("2020-08-07"),
      totalTracks: 16,
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      genres: ["Indie Rock", "Alternative Rock"],
      type: "album",
    },
    duration: 30, // 30 seconds for demo
    previewUrl: "/audio/track-5.wav",
    streamUrl: "/audio/track-5.wav",
    isExplicit: false,
    popularity: 89,
    trackNumber: 11,
    genres: ["Indie Rock", "Alternative Rock"],
    releaseDate: new Date("2020-08-07"),
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
  },
];

interface AudioDemoProps {
  className?: string;
}

export function AudioDemo({ className }: AudioDemoProps) {
  const { 
    play, 
    setQueue, 
    addToQueue,
    toggleShuffle,
    initializeAudioEngine,
    currentTrack,
    isPlaying,
    shuffleMode,
  } = usePlayerStore();

  // Initialize audio engine when component mounts
  useEffect(() => {
    initializeAudioEngine();
  }, [initializeAudioEngine]);

  const handlePlayTrack = (track: Track, index: number) => {
    setQueue(DEMO_TRACKS, index);
    play(track);
  };

  const handlePlayAll = () => {
    setQueue(DEMO_TRACKS, 0);
    play(DEMO_TRACKS[0]);
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(track);
  };

  const handleShufflePlay = () => {
    if (!shuffleMode) {
      toggleShuffle();
    }
    setQueue(DEMO_TRACKS, 0);
    play(DEMO_TRACKS[0]);
  };

  return (
    <div className={cn("audio-demo p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Enhanced Audio Player Demo
          </h2>
          <p className="text-gray-400">
            Experience advanced Web Audio API features with crossfade, equalizer, and visualizer
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="spotify"
            onClick={handlePlayAll}
            className="flex items-center space-x-2"
          >
            <PlayIcon className="h-4 w-4" />
            <span>Play All</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShufflePlay}
            className={cn(
              "flex items-center space-x-2",
              shuffleMode && "text-spotify-green border-spotify-green"
            )}
          >
            <ShuffleIcon className="h-4 w-4" />
            <span>Shuffle</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setQueue(DEMO_TRACKS)}
            className="flex items-center space-x-2"
          >
            <QueueListIcon className="h-4 w-4" />
            <span>Add All to Queue</span>
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-2">Web Audio API</h3>
          <p className="text-sm text-gray-400">
            Advanced audio processing with low-latency playback and precise control
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-2">Crossfade & Gapless</h3>
          <p className="text-sm text-gray-400">
            Smooth transitions between tracks with configurable crossfade duration
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-2">10-Band Equalizer</h3>
          <p className="text-sm text-gray-400">
            Real-time audio processing with preset options and custom settings
          </p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-2">Audio Visualizer</h3>
          <p className="text-sm text-gray-400">
            Real-time spectrum analysis with multiple visualization styles
          </p>
        </div>
      </div>

      {/* Track List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Demo Tracks</h3>
          <p className="text-sm text-gray-400">
            Generated audio tones for testing (30 seconds each)
          </p>
        </div>
        
        <div className="divide-y divide-gray-700">
          {DEMO_TRACKS.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            
            return (
              <div
                key={track.id}
                className={cn(
                  "flex items-center space-x-4 p-4 hover:bg-gray-700/50 transition-colors",
                  isCurrentTrack && "bg-gray-700/30"
                )}
              >
                {/* Track Number / Play Button */}
                <div className="w-8 flex items-center justify-center">
                  {isCurrentTrack && isPlaying ? (
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-spotify-green animate-pulse"></div>
                      <div className="w-1 h-2 bg-spotify-green animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-4 bg-spotify-green animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => handlePlayTrack(track, index)}
                    >
                      <PlayIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Track Info */}
                <div className="flex-1">
                  <h4 className={cn(
                    "font-medium truncate",
                    isCurrentTrack ? "text-spotify-green" : "text-white"
                  )}>
                    {track.title}
                  </h4>
                  <p className="text-sm text-gray-400 truncate">
                    {track.artist.name}
                  </p>
                </div>
                
                {/* Album */}
                <div className="hidden md:block text-sm text-gray-400">
                  {track.album.title}
                </div>
                
                {/* Duration */}
                <div className="text-sm text-gray-400 w-12 text-right">
                  0:30
                </div>
                
                {/* Add to Queue */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
                  onClick={() => handleAddToQueue(track)}
                >
                  Add to Queue
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-semibold text-white mb-2">Keyboard Shortcuts</h3>
        <p className="text-sm text-gray-400 mb-3">
          Use keyboard shortcuts for quick control (press the Help button in the player for full list):
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <code className="bg-gray-700 px-2 py-1 rounded">Space</code>
            <span className="text-gray-400">Play/Pause</span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-700 px-2 py-1 rounded">← →</code>
            <span className="text-gray-400">Seek</span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-700 px-2 py-1 rounded">↑ ↓</code>
            <span className="text-gray-400">Volume</span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-700 px-2 py-1 rounded">S</code>
            <span className="text-gray-400">Shuffle</span>
          </div>
        </div>
      </div>
    </div>
  );
}