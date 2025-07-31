'use client';

import { useSearchParams } from 'next/navigation';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function SpotifyErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'access_denied':
        return 'You denied access to your Spotify account';
      case 'state_mismatch':
        return 'Security validation failed. Please try again';
      case 'no_code':
        return 'No authorization code received from Spotify';
      case 'token_exchange_failed':
        return 'Failed to authenticate with Spotify. Please try again';
      default:
        return 'An unexpected error occurred';
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <XCircleIcon className="w-24 h-24 text-red-500 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Connection Failed</h1>
          <p className="text-xl text-gray-400">{getErrorMessage(error)}</p>
        </div>

        <div className="space-y-4">
          <Link href="/api/spotify/auth?action=login">
            <Button className="w-full bg-spotify-green text-black hover:bg-spotify-green/90">
              Try Again
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go Back Home
            </Button>
          </Link>
        </div>

        {error && (
          <p className="text-sm text-gray-600">
            Error code: {error}
          </p>
        )}
      </div>
    </div>
  );
}