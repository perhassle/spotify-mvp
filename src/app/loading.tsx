import { Music2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Animated Spotify-like loader */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-neutral-800 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          <Music2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-green-500" />
        </div>
        
        {/* Loading text */}
        <p className="mt-4 text-neutral-400 animate-pulse">
          Loading your music...
        </p>
      </div>
    </div>
  );
}