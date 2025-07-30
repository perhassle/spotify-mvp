'use client';

import { useState } from 'react';
import { ShareIcon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { ShareableContent, SocialShareOptions } from '@/types';

interface SocialShareButtonsProps {
  content: ShareableContent;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  platforms?: string[];
  showLabels?: boolean;
  customMessage?: string;
  className?: string;
  onShare?: (platform: string, shareUrl: string) => void;
}

const SOCIAL_PLATFORMS = {
  twitter: {
    name: 'Twitter',
    icon: '𝕏',
    color: 'hover:bg-black hover:text-white',
    shareUrl: (url: string, title: string, text: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: 'hover:bg-blue-600 hover:text-white',
    shareUrl: (url: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white',
    shareUrl: () => '', // Instagram doesn't support direct URL sharing
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'hover:bg-blue-700 hover:text-white',
    shareUrl: (url: string) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: 'hover:bg-green-600 hover:text-white',
    shareUrl: (url: string, title: string, text: string) => 
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    color: 'hover:bg-blue-500 hover:text-white',
    shareUrl: (url: string, title: string, text: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  copy: {
    name: 'Copy Link',
    icon: '🔗',
    color: 'hover:bg-gray-600 hover:text-white',
    shareUrl: () => '',
  },
  native: {
    name: 'Share',
    icon: '📤',
    color: 'hover:bg-gray-600 hover:text-white',
    shareUrl: () => '',
  },
};

export function SocialShareButtons({
  content,
  size = 'md',
  orientation = 'horizontal',
  platforms = ['twitter', 'facebook', 'linkedin', 'whatsapp', 'copy'],
  showLabels = false,
  customMessage = '',
  className = '',
  onShare,
}: SocialShareButtonsProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const generateShareUrl = async (): Promise<string> => {
    if (shareUrl) return shareUrl;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: content.type,
          contentId: content.id,
          customMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const url = data.data.shareLink.shortUrl;
        setShareUrl(url);
        return url;
      }
      throw new Error('Failed to generate share URL');
    } catch (error) {
      console.error('Error generating share URL:', error);
      return window.location.href; // Fallback to current page URL
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (platformId: string) => {
    const platform = SOCIAL_PLATFORMS[platformId as keyof typeof SOCIAL_PLATFORMS];
    if (!platform) return;

    const url = await generateShareUrl();
    const title = content.title;
    const text = customMessage || content.description || `Check out ${content.title}`;

    if (platformId === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        onShare?.(platformId, url);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
      return;
    }

    if (platformId === 'native' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        onShare?.(platformId, url);
      } catch (error) {
        console.error('Native share failed:', error);
      }
      return;
    }

    if (platformId === 'instagram') {
      // Instagram doesn't support direct URL sharing, so copy link instead
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        alert('Link copied! Open Instagram and paste it in your story or post.');
        onShare?.(platformId, url);
      } catch (error) {
        console.error('Failed to copy link for Instagram:', error);
      }
      return;
    }

    const shareUrlPlatform = platform.shareUrl(url, title, text);
    if (shareUrlPlatform) {
      // Track share activity
      try {
        await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: content.type,
            contentId: content.id,
            platform: platformId,
            customMessage,
          }),
        });
      } catch (error) {
        console.error('Error tracking share:', error);
      }

      window.open(shareUrlPlatform, '_blank', 'width=600,height=400');
      onShare?.(platformId, url);
    }
  };

  const buttonSizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base',
  };

  const iconSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const containerClasses = orientation === 'horizontal' 
    ? 'flex flex-wrap gap-2' 
    : 'flex flex-col gap-2';

  // Add native share button if available and not explicitly excluded
  const availablePlatforms = [...platforms];
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && !platforms.includes('native')) {
    availablePlatforms.push('native');
  }

  return (
    <div className={`${containerClasses} ${className}`}>
      {availablePlatforms.map((platformId) => {
        const platform = SOCIAL_PLATFORMS[platformId as keyof typeof SOCIAL_PLATFORMS];
        if (!platform) return null;

        const isDisabled = isGenerating;
        const showCopied = platformId === 'copy' && copiedLink;

        return (
          <Button
            key={platformId}
            onClick={() => handleShare(platformId)}
            disabled={isDisabled}
            variant="outline"
            className={`
              ${buttonSizeClasses[size]}
              ${platform.color}
              border-gray-300 text-gray-700
              transition-all duration-200
              hover:scale-105
              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              ${showLabels ? 'min-w-[120px]' : 'aspect-square'}
            `}
            aria-label={`Share on ${platform.name}`}
          >
            <div className="flex items-center gap-2">
              {showCopied ? (
                <CheckIcon className="w-4 h-4 text-green-600" />
              ) : (
                <span className={iconSizeClasses[size]}>
                  {isDisabled && platformId !== 'copy' ? '⏳' : platform.icon}
                </span>
              )}
              {showLabels && (
                <span className="font-medium">
                  {showCopied ? 'Copied!' : platform.name}
                </span>
              )}
            </div>
          </Button>
        );
      })}

      {/* Quick Share Button */}
      <Button
        onClick={() => handleShare('copy')}
        disabled={isGenerating}
        variant="outline"
        className={`
          ${buttonSizeClasses[size]}
          border-green-500 text-green-600 hover:bg-green-50
          transition-all duration-200
          hover:scale-105
          focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          disabled:opacity-50
          ${showLabels ? 'min-w-[120px]' : 'aspect-square'}
        `}
        aria-label="Quick share - copy link"
      >
        <div className="flex items-center gap-2">
          {copiedLink ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <ShareIcon className="w-4 h-4" />
          )}
          {showLabels && (
            <span className="font-medium">
              {copiedLink ? 'Copied!' : 'Quick Share'}
            </span>
          )}
        </div>
      </Button>
    </div>
  );
}

// Compact version for use in cards and lists
interface CompactShareButtonProps {
  content: ShareableContent;
  customMessage?: string;
  className?: string;
  onShare?: (platform: string, shareUrl: string) => void;
}

export function CompactShareButton({
  content,
  customMessage = '',
  className = '',
  onShare,
}: CompactShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleQuickShare = async () => {
    if (navigator.share) {
      try {
        if (!shareUrl) {
          const response = await fetch('/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentType: content.type,
              contentId: content.id,
              customMessage,
            }),
          });

          const data = await response.json();
          if (data.success) {
            setShareUrl(data.data.shareLink.shortUrl);
          }
        }

        await navigator.share({
          title: content.title,
          text: customMessage || content.description || `Check out ${content.title}`,
          url: shareUrl || window.location.href,
        });

        onShare?.('native', shareUrl || window.location.href);
      } catch (error) {
        console.error('Share failed:', error);
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={handleQuickShare}
        variant="ghost"
        size="sm"
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        aria-label="Share"
      >
        <ShareIcon className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <SocialShareButtons
            content={content}
            size="sm"
            orientation="vertical"
            platforms={['twitter', 'facebook', 'whatsapp', 'copy']}
            showLabels={false}
            customMessage={customMessage}
            onShare={(platform, url) => {
              onShare?.(platform, url);
              setIsOpen(false);
            }}
            className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg"
          />
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}