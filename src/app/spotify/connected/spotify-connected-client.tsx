'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';

export function SpotifyConnectedClient() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <CheckCircleIcon className="w-24 h-24 text-spotify-green mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Successfully Connected!</h1>
          <p className="text-xl text-gray-400">Your Spotify account has been linked</p>
        </div>

        <div className="text-gray-500">
          Redirecting to home in {countdown} seconds...
        </div>

        <Button 
          onClick={() => router.push('/')}
          className="bg-spotify-green text-black hover:bg-spotify-green/90"
        >
          Go to Home Now
        </Button>
      </div>
    </div>
  );
}