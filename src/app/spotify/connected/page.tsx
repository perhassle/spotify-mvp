import { Metadata } from 'next';
import { SpotifyConnectedClient } from './spotify-connected-client';

export const metadata: Metadata = {
  title: 'Spotify Connected | Spotify MVP',
  description: 'Successfully connected to Spotify',
};

export default function SpotifyConnectedPage() {
  return <SpotifyConnectedClient />;
}