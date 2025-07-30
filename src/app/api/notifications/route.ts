import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Notification } from '@/types';

// Mock database for notifications
const notifications: Notification[] = [];

// Mock function to generate notifications for followed artists
function generateMockNotifications(userId: string): Notification[] {
  const mockNotifications: Notification[] = [
    {
      id: `notif-${Date.now()}-1`,
      userId,
      type: 'new_release',
      title: 'New Release from The Weeknd',
      message: 'The Weeknd just released "Blinding Lights (Remix)"',
      imageUrl: '/images/placeholder-album.png',
      actionUrl: '/track/new-release-1',
      actionText: 'Listen Now',
      isRead: false,
      isPersistent: false,
      priority: 'medium',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      channels: ['in_app', 'email'],
      metadata: {
        artistId: '1',
        artistName: 'The Weeknd',
        releaseType: 'single',
        trackId: 'new-release-1'
      }
    },
    {
      id: `notif-${Date.now()}-2`,
      userId,
      type: 'artist_update',
      title: 'Concert Announcement',
      message: 'Billie Eilish announced new tour dates for 2024',
      imageUrl: '/images/placeholder-artist.png',
      actionUrl: '/artist/2',
      actionText: 'View Details',
      isRead: false,
      isPersistent: true,
      priority: 'high',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      channels: ['in_app', 'push'],
      metadata: {
        artistId: '2',
        artistName: 'Billie Eilish',
        eventType: 'tour_announcement'
      }
    },
    {
      id: `notif-${Date.now()}-3`,
      userId,
      type: 'new_release',
      title: 'Album Release',
      message: 'Dua Lipa released her new album "Future Nostalgia Deluxe"',
      imageUrl: '/images/placeholder-album.png',
      actionUrl: '/album/new-album-1',
      actionText: 'Listen Now',
      isRead: true,
      isPersistent: false,
      priority: 'medium',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      readAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      channels: ['in_app', 'email'],
      metadata: {
        artistId: '3',
        artistName: 'Dua Lipa',
        releaseType: 'album',
        albumId: 'new-album-1'
      }
    },
    {
      id: `notif-${Date.now()}-4`,
      userId,
      type: 'friend_activity',
      title: 'Friend Activity',
      message: 'Your friend Sarah liked "Good 4 U" by Olivia Rodrigo',
      imageUrl: '/images/placeholder-album.png',
      actionUrl: '/track/friend-liked-1',
      isRead: false,
      isPersistent: false,
      priority: 'low',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      channels: ['in_app'],
      metadata: {
        friendId: 'friend-1',
        friendName: 'Sarah',
        activityType: 'liked_track',
        trackId: 'friend-liked-1'
      }
    }
  ];

  return mockNotifications;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Generate mock notifications
    let userNotifications = generateMockNotifications(userId);

    // Filter unread if requested
    if (unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.isRead);
    }

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const paginatedNotifications = userNotifications.slice(offset, offset + limit);

    // Calculate stats
    const unreadCount = userNotifications.filter(n => !n.isRead).length;
    const totalCount = userNotifications.length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        stats: {
          total: totalCount,
          unread: unreadCount,
          highPriority: userNotifications.filter(n => n.priority === 'high' && !n.isRead).length,
        },
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, title, message, actionUrl, actionText, priority = 'medium', channels = ['in_app'] } = body;

    const userId = session.user.email;
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId,
      type,
      title,
      message,
      actionUrl,
      actionText,
      isRead: false,
      isPersistent: false,
      priority,
      createdAt: new Date(),
      channels,
    };

    // Store notification (in real app, save to database)
    notifications.push(notification);

    return NextResponse.json({
      success: true,
      data: { notification },
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}