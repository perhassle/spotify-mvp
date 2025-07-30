import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const notificationId = resolvedParams.id;
    const userId = session.user.email;

    // In a real app, you would update the notification in the database
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        notificationId,
        readAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}