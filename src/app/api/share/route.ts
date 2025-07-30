import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { ShareLink, ShareActivity, ShareableContent } from '@/types';

// Mock database
const shareLinks: ShareLink[] = [];
const shareActivities: ShareActivity[] = [];

// Generate short URL (in production, use a URL shortening service)
function generateShortUrl(_originalUrl: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const shortCode = Math.random().toString(36).substring(2, 8);
  return `${baseUrl}/s/${shortCode}`;
}

// Generate embed code for content
function generateEmbedCode(contentType: string, contentId: string, options: { width?: number; height?: number; theme?: string } = {}): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const width = options.width || 400;
  const height = options.height || 600;
  const theme = options.theme || 'dark';
  
  return `<iframe src="${baseUrl}/embed/${contentType}/${contentId}?theme=${theme}" width="${width}" height="${height}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}

// Get content details for sharing
async function getShareableContent(contentType: string, contentId: string): Promise<ShareableContent | null> {
  // This would normally query your database
  switch (contentType) {
    case 'track':
      return {
        id: contentId,
        type: 'track',
        title: `Track ${contentId}`,
        subtitle: `Artist Name`,
        imageUrl: '/images/placeholder-album.png',
        description: 'Check out this amazing track!',
        url: `/track/${contentId}`,
      };
    case 'album':
      return {
        id: contentId,
        type: 'album',
        title: `Album ${contentId}`,
        subtitle: `Artist Name`,
        imageUrl: '/images/placeholder-album.png',
        description: 'Listen to this incredible album!',
        url: `/album/${contentId}`,
      };
    case 'playlist':
      return {
        id: contentId,
        type: 'playlist',
        title: `Playlist ${contentId}`,
        subtitle: `Created by User`,
        imageUrl: '/images/placeholder-album.png',
        description: 'Check out this curated playlist!',
        url: `/playlist/${contentId}`,
      };
    case 'artist':
      return {
        id: contentId,
        type: 'artist',
        title: `Artist ${contentId}`,
        subtitle: 'Artist',
        imageUrl: '/images/placeholder-artist.png',
        description: 'Discover this amazing artist!',
        url: `/artist/${contentId}`,
      };
    default:
      return null;
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
    const { contentType, contentId, customMessage, platform, embedOptions } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Content type and ID are required' },
        { status: 400 }
      );
    }

    const userId = session.user.email;
    const content = await getShareableContent(contentType, contentId);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${contentType}/${contentId}`;
    const shortUrl = generateShortUrl(shareUrl);

    // Create share link
    const shareLink: ShareLink = {
      id: `share-${Date.now()}-${Math.random()}`,
      contentType,
      contentId,
      shareUrl,
      shortUrl,
      createdBy: userId,
      createdAt: new Date(),
      isPublic: true,
      allowPreview: true,
      viewCount: 0,
      clickCount: 0,
      customMessage: customMessage || '',
      embedCode: ['playlist', 'album', 'track'].includes(contentType) 
        ? generateEmbedCode(contentType, contentId, embedOptions) 
        : undefined,
    };

    shareLinks.push(shareLink);

    // Track share activity if platform is specified
    if (platform) {
      const shareActivity: ShareActivity = {
        id: `activity-${Date.now()}-${Math.random()}`,
        userId,
        contentType,
        contentId,
        platform,
        shareUrl: shortUrl,
        customMessage: customMessage || '',
        sharedAt: new Date(),
        clickCount: 0,
        conversionCount: 0,
      };

      shareActivities.push(shareActivity);
    }

    return NextResponse.json({
      success: true,
      data: {
        shareLink,
        content,
      },
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
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

    // Get user's share history
    const userShares = shareActivities
      .filter(s => s.userId === userId)
      .sort((a, b) => b.sharedAt.getTime() - a.sharedAt.getTime())
      .slice(offset, offset + limit);

    // Get content details for each share
    const sharesWithContent = await Promise.all(
      userShares.map(async (share) => {
        const content = await getShareableContent(share.contentType, share.contentId);
        return {
          ...share,
          content,
        };
      })
    );

    const totalShares = shareActivities.filter(s => s.userId === userId).length;
    const hasMore = offset + limit < totalShares;

    return NextResponse.json({
      success: true,
      data: {
        shares: sharesWithContent,
        pagination: {
          limit,
          offset,
          total: totalShares,
          hasMore,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching share history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share history' },
      { status: 500 }
    );
  }
}