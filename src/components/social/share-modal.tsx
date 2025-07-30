'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  XMarkIcon,
  LinkIcon,
  EnvelopeIcon,
  CodeBracketIcon,
  ShareIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useShareModalStore } from '@/stores/social-store';
import { SocialShareOptions, EmailShareRequest } from '@/types';

// Social media platform configurations
const SOCIAL_PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '𝕏',
    color: 'bg-black hover:bg-gray-800',
    textColor: 'text-white'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-white'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    textColor: 'text-white'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    textColor: 'text-white'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-600 hover:bg-green-700',
    textColor: 'text-white'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-white'
  }
];

interface ShareModalProps {
  className?: string;
}

export function ShareModal({ className = '' }: ShareModalProps) {
  const {
    isOpen,
    content,
    activeTab,
    customMessage,
    selectedPlatforms,
    emailRecipients,
    embedOptions,
    closeShareModal,
    setActiveTab,
    setCustomMessage,
    addSelectedPlatform,
    removeSelectedPlatform,
    addEmailRecipient,
    removeEmailRecipient,
    updateEmbedOptions,
  } = useShareModalStore();

  const [shareUrl, setShareUrl] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeShareModal();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeShareModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeShareModal]);

  const generateShareLink = useCallback(async () => {
    if (!content) return;

    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: content.type,
          contentId: content.id,
          customMessage,
          embedOptions: embedOptions,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShareUrl(data.data.shareLink.shortUrl);
        if (data.data.shareLink.embedCode) {
          setEmbedCode(data.data.shareLink.embedCode);
        }
      }
    } catch (error) {
      console.error('Error generating share link:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  }, [content, customMessage, embedOptions]);

  // Generate share link when modal opens
  useEffect(() => {
    if (isOpen && content && !shareUrl) {
      generateShareLink();
    }
  }, [isOpen, content, shareUrl, generateShareLink]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCopyEmbed = async () => {
    if (!embedCode) return;

    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch (error) {
      console.error('Failed to copy embed code:', error);
    }
  };

  const handleSocialShare = async (platformId: string) => {
    if (!content || !shareUrl) return;

    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;

    setIsSharing(true);

    const shareOptions: SocialShareOptions = {
      platform: platformId as 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'telegram',
      title: content.title,
      description: content.description || `Check out ${content.title}`,
      imageUrl: content.imageUrl,
      url: shareUrl,
      customMessage,
    };

    // Generate platform-specific share URLs
    let shareUrlPlatform = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const _encodedTitle = encodeURIComponent(content.title);
    const encodedText = encodeURIComponent(shareOptions.description || '');

    switch (platformId) {
      case 'twitter':
        shareUrlPlatform = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrlPlatform = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrlPlatform = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrlPlatform = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrlPlatform = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
    }

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

      // Open share window
      window.open(shareUrlPlatform, '_blank', 'width=600,height=400');
    }

    setIsSharing(false);
  };

  const handleEmailShare = async () => {
    if (!emailInput.trim() || !content || !shareUrl) return;

    setIsSharing(true);

    const emailRequest: EmailShareRequest = {
      recipientEmail: emailInput.trim(),
      recipientName: '',
      senderName: 'You',
      contentType: content.type,
      contentId: content.id,
      personalMessage: emailMessage || customMessage,
      includePreview: true,
      template: 'default',
    };

    try {
      const response = await fetch('/api/share/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailRequest),
      });

      const data = await response.json();
      if (data.success) {
        addEmailRecipient(emailInput.trim());
        setEmailInput('');
        setEmailMessage('');
        // Could show success toast here
        console.log('Email sent successfully');
      } else {
        console.error('Email send failed:', data.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleNativeShare = async () => {
    if (!content || !shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description || `Check out ${content.title}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!isOpen || !content) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 ${className}`}>
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Share {content.title}</h2>
          <button
            onClick={closeShareModal}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close share modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {content.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.imageUrl}
                alt={content.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-white">{content.title}</h3>
              {content.subtitle && <p className="text-sm text-gray-400">{content.subtitle}</p>}
              {content.description && <p className="text-sm text-gray-300 mt-1 line-clamp-2">{content.description}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'social', label: 'Social Media', icon: ShareIcon },
            { id: 'copy', label: 'Copy Link', icon: LinkIcon },
            { id: 'email', label: 'Email', icon: EnvelopeIcon },
            ...((['playlist', 'album', 'track'].includes(content.type)) ? [{ id: 'embed', label: 'Embed', icon: CodeBracketIcon }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'social' | 'copy' | 'email' | 'embed')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Share your thoughts about this music..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Social Platforms */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Choose platforms
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handleSocialShare(platform.id)}
                      disabled={isSharing || isGeneratingLink}
                      className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all
                        ${platform.color} ${platform.textColor}
                        disabled:opacity-50 disabled:cursor-not-allowed
                        hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900
                      `}
                    >
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-sm">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Native Share (Mobile) */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={handleNativeShare}
                    disabled={isGeneratingLink}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                  >
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                    More sharing options
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Copy Link Tab */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Copy this link to share anywhere
              </p>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 border border-gray-600 rounded-lg p-3">
                  {isGeneratingLink ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                      Generating link...
                    </div>
                  ) : (
                    <span className="text-white text-sm font-mono break-all">
                      {shareUrl || 'Link will appear here...'}
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleCopyLink}
                  disabled={!shareUrl || isGeneratingLink}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {copiedLink ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {copiedLink && (
                <p className="text-green-400 text-sm">Link copied to clipboard!</p>
              )}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="friend@example.com"
                    className="flex-1 bg-gray-800 border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleEmailShare}
                    disabled={!emailInput.trim() || isSharing || !shareUrl}
                    className="px-6 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSharing ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Personal message (optional)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="I thought you'd enjoy this..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {emailRecipients.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Recently shared with:</p>
                  <div className="flex flex-wrap gap-2">
                    {emailRecipients.slice(0, 5).map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Embed Tab */}
          {activeTab === 'embed' && ['playlist', 'album', 'track'].includes(content.type) && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Embed this {content.type} on your website
              </p>

              {/* Embed Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Width</label>
                  <Input
                    type="number"
                    value={embedOptions.width || 400}
                    onChange={(e) => updateEmbedOptions({ width: parseInt(e.target.value) || 400 })}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="300"
                    max="800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
                  <Input
                    type="number"
                    value={embedOptions.height || 600}
                    onChange={(e) => updateEmbedOptions({ height: parseInt(e.target.value) || 600 })}
                    className="bg-gray-800 border-gray-600 text-white"
                    min="200"
                    max="800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={embedOptions.showCover !== false}
                    onChange={(e) => updateEmbedOptions({ showCover: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500"
                  />
                  Show cover art
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={embedOptions.showTrackList !== false}
                    onChange={(e) => updateEmbedOptions({ showTrackList: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500"
                  />
                  Show track list
                </label>
              </div>

              {/* Embed Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Embed code</label>
                  <Button
                    onClick={handleCopyEmbed}
                    disabled={!embedCode}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {copiedEmbed ? (
                      <>
                        <CheckIcon className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <textarea
                  value={embedCode || 'Embed code will appear here...'}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 font-mono text-xs resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}