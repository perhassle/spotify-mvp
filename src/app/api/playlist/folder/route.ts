import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { PlaylistFolder } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, color }: { name: string; color?: string } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newFolder: PlaylistFolder = {
      id: folderId,
      name: name.trim(),
      userId: session.user.id || 'user-1',
      playlists: [],
      color: color || '#1DB954', // Spotify green as default
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real app, save to database
    // await db.playlistFolder.create({ data: newFolder });

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real app, fetch user's folders
    // const folders = await db.playlistFolder.findMany({
    //   where: { userId: session.user.id },
    //   include: { playlists: true }
    // });

    // Mock response
    const mockFolders: PlaylistFolder[] = [
      {
        id: 'folder-1',
        name: 'Favorites',
        userId: session.user.id || 'user-1',
        playlists: [],
        color: '#1DB954',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'folder-2',
        name: 'Workouts',
        userId: session.user.id || 'user-1',
        playlists: [],
        color: '#FF6B35',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    return NextResponse.json(mockFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}