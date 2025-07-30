import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, Music2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="text-[200px] font-bold text-neutral-800 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 className="w-24 h-24 text-green-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Page not found
        </h1>
        <p className="text-xl text-neutral-400 mb-12 max-w-md mx-auto">
          Looks like this track got lost in the shuffle. 
          Let's get you back to the music.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="border-neutral-700 hover:border-neutral-600 px-8 py-6 text-lg">
              <Search className="w-5 h-5 mr-2" />
              Search Music
            </Button>
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-16 max-w-md mx-auto">
          <p className="text-sm text-neutral-500 mb-4">Popular destinations:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Browse', 'Library', 'Artists', 'Albums', 'Playlists'].map((link) => (
              <Link
                key={link}
                href={`/${link.toLowerCase()}`}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-sm text-white transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}