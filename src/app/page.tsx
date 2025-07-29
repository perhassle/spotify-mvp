"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player-store";
import { PlayIcon, ClockIcon, HeartIcon } from "@heroicons/react/24/outline";
import { formatDuration } from "@/lib/utils";
import type { Track, Artist, Album } from "@/types";

// Mock data for demonstration
const mockArtist: Artist = {
  id: "artist-1",
  name: "Demo Artist",
  bio: "A great artist for demonstration",
  imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  genres: ["Pop", "Rock"],
  followers: 1500000,
  isVerified: true,
  popularity: 85,
};

const mockAlbum: Album = {
  id: "album-1",
  title: "Demo Album",
  artist: mockArtist,
  releaseDate: new Date("2024-01-15"),
  totalTracks: 12,
  imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  genres: ["Pop", "Rock"],
  type: "album",
};

const mockTracks: Track[] = [
  {
    id: "track-1",
    title: "Sample Song 1",
    artist: mockArtist,
    album: mockAlbum,
    duration: 210, // 3:30
    previewUrl: "https://example.com/preview1.mp3",
    isExplicit: false,
    popularity: 92,
    trackNumber: 1,
    genres: ["Pop"],
    releaseDate: new Date("2024-01-15"),
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  },
  {
    id: "track-2",
    title: "Another Great Track",
    artist: mockArtist,
    album: mockAlbum,
    duration: 195, // 3:15
    previewUrl: "https://example.com/preview2.mp3",
    isExplicit: false,
    popularity: 88,
    trackNumber: 2,
    genres: ["Rock"],
    releaseDate: new Date("2024-01-15"),
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
  },
  {
    id: "track-3",
    title: "Demo Track Three",
    artist: mockArtist,
    album: mockAlbum,
    duration: 240, // 4:00
    previewUrl: "https://example.com/preview3.mp3",
    isExplicit: true,
    popularity: 76,
    trackNumber: 3,
    genres: ["Pop", "Rock"],
    releaseDate: new Date("2024-01-15"),
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
  },
];

export default function HomePage() {
  const { play, setQueue, currentTrack } = usePlayerStore();

  const handlePlayTrack = (track: Track, index: number) => {
    setQueue(mockTracks, index);
    play(track);
  };

  const handlePlayAll = () => {
    setQueue(mockTracks, 0);
    play(mockTracks[0]);
  };

  // Simulate some progress for demo purposes
  useEffect(() => {
    if (currentTrack) {
      const interval = setInterval(() => {
        usePlayerStore.getState().updateProgress(
          Math.min(usePlayerStore.getState().progress + 1, currentTrack.duration)
        );
      }, 1000);

      usePlayerStore.getState().setDuration(currentTrack.duration);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [currentTrack]);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">
          Good evening
        </h1>
        <p className="text-lg text-gray-300">
          Welcome to your Spotify MVP music streaming experience
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Ready to Stream</h3>
          <p className="text-sm opacity-90 mb-4">
            Your music streaming platform is set up and ready to go!
          </p>
          <Button 
            variant="spotify" 
            onClick={handlePlayAll}
            className="bg-white text-black hover:bg-gray-100"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Play Demo Songs
          </Button>
        </div>
        
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Features Included</h3>
          <ul className="text-sm space-y-1">
            <li>• Music player with controls</li>
            <li>• Queue management</li>
            <li>• Responsive design</li>
            <li>• State management</li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Next Steps</h3>
          <ul className="text-sm space-y-1">
            <li>• Add authentication</li>
            <li>• Connect to music API</li>
            <li>• Implement search</li>
            <li>• Add more features</li>
          </ul>
        </div>
      </div>

      {/* Demo Playlist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Demo Tracks</h2>
          <Button 
            variant="outline" 
            onClick={handlePlayAll}
            className="border-gray-600 text-gray-300 hover:text-white hover:border-white"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Play All
          </Button>
        </div>

        <div className="bg-gray-900/50 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Title</div>
              <div className="col-span-3">Album</div>
              <div className="col-span-1">
                <ClockIcon className="h-4 w-4" />
              </div>
              <div className="col-span-1">
                <HeartIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-800">
            {mockTracks.map((track, index) => (
              <div
                key={track.id}
                className="group px-6 py-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => handlePlayTrack(track, index)}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <div className="flex items-center justify-center w-6 h-6">
                      <span className="text-gray-400 group-hover:hidden">
                        {index + 1}
                      </span>
                      <PlayIcon className="h-4 w-4 text-white hidden group-hover:block" />
                    </div>
                  </div>
                  
                  <div className="col-span-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        {track.imageUrl && (
                          <img
                            src={track.imageUrl}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {track.title}
                        </h4>
                        <p className="text-gray-400 text-sm truncate">
                          {track.artist.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <p className="text-gray-400 text-sm truncate">
                      {track.album.title}
                    </p>
                  </div>
                  
                  <div className="col-span-1">
                    <span className="text-gray-400 text-sm">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle like functionality
                      }}
                    >
                      <HeartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Stack Info */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Built With Modern Technologies
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <div className="text-blue-400 font-semibold">Next.js 15</div>
            <div className="text-gray-400">React Framework</div>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <div className="text-blue-400 font-semibold">TypeScript</div>
            <div className="text-gray-400">Type Safety</div>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <div className="text-cyan-400 font-semibold">Tailwind CSS</div>
            <div className="text-gray-400">Styling</div>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <div className="text-purple-400 font-semibold">Zustand</div>
            <div className="text-gray-400">State Management</div>
          </div>
        </div>
      </div>
    </div>
  );
}