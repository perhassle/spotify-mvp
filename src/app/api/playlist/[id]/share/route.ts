import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { PlaylistShareSettings } from '@/types';

export async function POST(
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
    const playlistId = resolvedParams.id;
    const settings: Partial<PlaylistShareSettings> = await request.json();

    // In a real app, verify playlist ownership
    // const playlist = await db.playlist.findUnique({
    //   where: { id: playlistId }
    // });

    // if (!playlist || playlist.ownerId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: 'Playlist not found or unauthorized' },
    //     { status: 404 }
    //   );
    // }

    // Generate unique share URL
    const shareToken = Math.random().toString(36).substr(2, 16);
    const shareUrl = `${process.env.NEXTAUTH_URL}/shared/playlist/${shareToken}`;

    // In a real app, save share settings to database
    // const shareSettings: PlaylistShareSettings = {
    //   shareUrl,
    //   allowCollaborators: settings.allowCollaborators ?? false,
    //   allowComments: settings.allowComments ?? false,
    //   allowDownloads: settings.allowDownloads ?? false,
    //   expiresAt: settings.expiresAt,
    //   password: settings.password
    // };

    // await db.playlistShare.create({
    //   data: {
    //     playlistId,
    //     token: shareToken,
    //     ...shareSettings
    //   }
    // });

    return NextResponse.json({ shareUrl });
  } catch (error) {
    console.error('Error generating share URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const playlistId = resolvedParams.id;
    const settings: Partial<PlaylistShareSettings> = await request.json();

    // In a real app, update share settings
    // await db.playlistShare.updateMany({
    //   where: {
    //     playlistId,
    //     playlist: { ownerId: session.user.id }
    //   },
    //   data: settings
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating share settings:', error);
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
    const playlistId = resolvedParams.id;

    // In a real app, delete share settings
    // await db.playlistShare.deleteMany({
    //   where: {
    //     playlistId,
    //     playlist: { ownerId: session.user.id }
    //   }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing share settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}