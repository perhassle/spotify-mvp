import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI_PROD || 'https://spotify-mvp.vercel.app/api/spotify/callback'
  : process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'https://localhost:3001/api/spotify/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  const cookieStore = await cookies();
  const storedState = cookieStore.get('spotify_auth_state')?.value;

  // Handle errors from Spotify
  if (error) {
    return NextResponse.redirect(new URL(`/spotify/error?error=${error}`, request.url));
  }

  // Verify state to prevent CSRF attacks
  if (!state || state !== storedState) {
    console.error('State mismatch error detected', {
      receivedState: state,
      storedState: storedState,
      url: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });
    return NextResponse.redirect(new URL('/spotify/error?error=state_mismatch', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/spotify/error?error=no_code', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Store tokens in secure cookies
    const response = NextResponse.redirect(new URL('/spotify/connected', request.url));
    
    // Set access token cookie
    response.cookies.set('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in, // Spotify tokens expire in 1 hour
    });
    
    // Set refresh token cookie
    if (tokenData.refresh_token) {
      response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    
    // Clear state cookie
    response.cookies.delete('spotify_auth_state');
    
    return response;
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(new URL('/spotify/error?error=token_exchange_failed', request.url));
  }
}