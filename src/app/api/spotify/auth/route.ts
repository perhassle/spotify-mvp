import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;

// Allowed redirect URIs for security
const ALLOWED_REDIRECT_URIS = [
  'https://spotify-mvp.vercel.app/api/spotify/callback',
  'https://spotify-mvp-git-feature-spotify-api-2c42b1-perhassles-projects.vercel.app/api/spotify/callback',
  'https://localhost:3001/api/spotify/callback',
  'http://localhost:3000/api/spotify/callback',
];

const rawRedirectUri = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI_PROD || 'https://spotify-mvp.vercel.app/api/spotify/callback'
  : process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'https://localhost:3001/api/spotify/callback';

const REDIRECT_URI = ALLOWED_REDIRECT_URIS.includes(rawRedirectUri)
  ? rawRedirectUri
  : 'https://localhost:3001/api/spotify/callback';

// Scopes for Spotify API access
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'user-follow-read',
  'user-follow-modify'
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'login') {
    // Generate random state for security
    const state = Math.random().toString(36).substring(7);
    
    // Store state in cookie for verification
    const response = NextResponse.redirect(
      `https://accounts.spotify.com/authorize?` +
      new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES.join(' '),
        redirect_uri: REDIRECT_URI!,
        state: state,
      }).toString()
    );
    
    response.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
    });
    
    return response;
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}