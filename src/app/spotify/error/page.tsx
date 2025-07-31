import { Metadata } from 'next';
import { SpotifyErrorClient } from './spotify-error-client';

export const metadata: Metadata = {
  title: 'Connection Error | Spotify MVP',
  description: 'Error connecting to Spotify',
};

export default function SpotifyErrorPage() {
  return <SpotifyErrorClient />;
}