import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const spotifyToken = cookieStore.get('spotify_access_token');
    
    return NextResponse.json({ 
      connected: !!spotifyToken 
    });
  } catch (error) {
    console.error('Error checking Spotify connection:', error);
    return NextResponse.json({ 
      connected: false 
    });
  }
}