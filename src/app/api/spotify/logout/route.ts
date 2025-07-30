import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear all Spotify-related cookies
    cookieStore.delete('spotify_access_token');
    cookieStore.delete('spotify_refresh_token');
    cookieStore.delete('spotify_auth_state');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}