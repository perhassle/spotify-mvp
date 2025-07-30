import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authConfig } from '@/lib/auth/config';
import { EmailShareRequest, ShareActivity } from '@/types';

// Mock email service - in production, use a service like SendGrid, AWS SES, etc.
async function sendShareEmail(shareRequest: EmailShareRequest, shareUrl: string): Promise<boolean> {
  // Simulate email sending
  console.log('Sending share email:', {
    to: shareRequest.recipientEmail,
    from: shareRequest.senderName,
    subject: `${shareRequest.senderName} shared ${shareRequest.contentType} with you`,
    content: {
      shareUrl,
      personalMessage: shareRequest.personalMessage,
      contentType: shareRequest.contentType,
      contentId: shareRequest.contentId,
    }
  });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate
  return Math.random() > 0.05;
}

// Generate email template
function generateEmailTemplate(shareRequest: EmailShareRequest, shareUrl: string, content: Awaited<ReturnType<typeof getShareableContent>>): string {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${shareRequest.senderName} shared music with you</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .content { padding: 30px 0; }
        .content-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .content-image { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin: 0 auto 15px; display: block; }
        .content-title { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .content-subtitle { font-size: 16px; color: #666; margin: 5px 0; }
        .personal-message { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; }
        .cta-button { display: inline-block; background: #1db954; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Music Shared with You</h1>
        </div>
        
        <div class="content">
          <p>Hi ${shareRequest.recipientName || 'there'},</p>
          <p><strong>${shareRequest.senderName}</strong> shared a ${shareRequest.contentType} with you!</p>
          
          ${shareRequest.personalMessage ? `
            <div class="personal-message">
              "${shareRequest.personalMessage}"
            </div>
          ` : ''}
          
          <div class="content-card">
            ${content?.imageUrl ? `<img src="${content.imageUrl}" alt="${content.title}" class="content-image">` : ''}
            <div class="content-title">${content?.title || `${shareRequest.contentType} ${shareRequest.contentId}`}</div>
            ${content?.subtitle ? `<div class="content-subtitle">${content.subtitle}</div>` : ''}
            ${content?.description ? `<p>${content.description}</p>` : ''}
            
            <a href="${shareUrl}" class="cta-button">
              Listen Now
            </a>
          </div>
          
          <p>Click the button above to start listening. You can enjoy a preview even without an account!</p>
        </div>
        
        <div class="footer">
          <p>Shared via Spotify MVP | <a href="${shareUrl}">Listen on Web</a></p>
          <p>If you don't want to receive these emails, you can update your preferences.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return baseTemplate;
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
    const shareRequest: EmailShareRequest = {
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      senderName: body.senderName || session.user.name || 'A friend',
      contentType: body.contentType,
      contentId: body.contentId,
      personalMessage: body.personalMessage,
      includePreview: body.includePreview !== false,
      template: body.template || 'default',
    };

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareRequest.recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get content details
    const content = await getShareableContent(shareRequest.contentType, shareRequest.contentId);
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Generate share URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareRequest.contentType}/${shareRequest.contentId}?ref=email`;

    // Generate email template
    const emailHtml = generateEmailTemplate(shareRequest, shareUrl, content);

    // Send email (mock implementation)
    const emailSent = await sendShareEmail(shareRequest, shareUrl);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Track email share activity
    const shareActivity: ShareActivity = {
      id: `email-share-${Date.now()}-${Math.random()}`,
      userId: session.user.email,
      contentType: shareRequest.contentType,
      contentId: shareRequest.contentId,
      platform: 'email',
      shareUrl,
      customMessage: shareRequest.personalMessage || '',
      sharedAt: new Date(),
      clickCount: 0,
      conversionCount: 0,
    };

    // In a real app, you'd save this to your database
    console.log('Email share activity:', shareActivity);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email sent successfully',
        recipient: shareRequest.recipientEmail,
        shareUrl,
      },
    });

  } catch (error) {
    console.error('Error sending share email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Helper function to get shareable content (same as in share/route.ts)
async function getShareableContent(contentType: string, contentId: string) {
  switch (contentType) {
    case 'track':
      return {
        id: contentId,
        type: 'track' as const,
        title: `Track ${contentId}`,
        subtitle: `Artist Name`,
        imageUrl: '/images/placeholder-album.png',
        description: 'Check out this amazing track!',
        url: `/track/${contentId}`,
      };
    case 'album':
      return {
        id: contentId,
        type: 'album' as const,
        title: `Album ${contentId}`,
        subtitle: `Artist Name`,
        imageUrl: '/images/placeholder-album.png',
        description: 'Listen to this incredible album!',
        url: `/album/${contentId}`,
      };
    case 'playlist':
      return {
        id: contentId,
        type: 'playlist' as const,
        title: `Playlist ${contentId}`,
        subtitle: `Created by User`,
        imageUrl: '/images/placeholder-album.png',
        description: 'Check out this curated playlist!',
        url: `/playlist/${contentId}`,
      };
    case 'artist':
      return {
        id: contentId,
        type: 'artist' as const,
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