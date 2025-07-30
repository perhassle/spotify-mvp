import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { PlaylistFolder } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const folderId = resolvedParams.id;
    const { name, color }: { name?: string; color?: string } = await request.json();

    // In a real app, verify ownership and update
    // const folder = await db.playlistFolder.findUnique({
    //   where: { id: folderId }
    // });

    // if (!folder || folder.userId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: 'Folder not found or unauthorized' },
    //     { status: 404 }
    //   );
    // }

    const updatedFolder: PlaylistFolder = {
      id: folderId,
      name: name || 'Updated Folder',
      userId: session.user.id || 'user-1',
      playlists: [],
      color: color || '#1DB954',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const folderId = resolvedParams.id;

    // In a real app, verify ownership and delete
    // const folder = await db.playlistFolder.findUnique({
    //   where: { id: folderId }
    // });

    // if (!folder || folder.userId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: 'Folder not found or unauthorized' },
    //     { status: 404 }
    //   );
    // }

    // Move playlists out of folder before deleting
    // await db.playlist.updateMany({
    //   where: { folderId },
    //   data: { folderId: null }
    // });

    // await db.playlistFolder.delete({
    //   where: { id: folderId }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}