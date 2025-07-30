'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ArtistFollowStats } from '@/types';

interface FollowButtonProps {
  artistId: string;
  artistName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showFollowerCount?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean, stats: ArtistFollowStats) => void;
}

export function FollowButton({
  artistId,
  artistName = 'Artist',
  size = 'md',
  variant = 'default',
  showFollowerCount = true,
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ArtistFollowStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/artist/${artistId}/follow`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setIsFollowing(data.data.isFollowing);
      } else {
        setError(data.error || 'Failed to fetch follow status');
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
      setError('Failed to fetch follow status');
    }
  }, [artistId]);

  // Fetch initial follow status and stats
  useEffect(() => {
    fetchFollowStatus();
  }, [artistId, status, fetchFollowStatus]);

  const handleFollowToggle = async () => {
    if (!session) {
      // Redirect to login or show login prompt
      window.location.href = '/auth/login';
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/artist/${artistId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const newIsFollowing = !isFollowing;
        const newStats = data.data.stats;
        
        setIsFollowing(newIsFollowing);
        setStats(newStats);
        
        // Call callback if provided
        onFollowChange?.(newIsFollowing, newStats);

        // Show success feedback
        if (newIsFollowing) {
          // Could add toast notification here
          console.log(`Now following ${artistName}`);
        } else {
          console.log(`Unfollowed ${artistName}`);
        }
      } else {
        setError(data.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setError('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  // Don't render if there's an error and no stats
  if (error && !stats) {
    return null;
  }

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const buttonVariantClasses = {
    default: isFollowing 
      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
      : 'bg-transparent hover:bg-white/10 text-white border-white/20',
    outline: isFollowing
      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
      : 'bg-transparent hover:bg-gray-100 text-gray-900 border-gray-300',
    ghost: isFollowing
      ? 'bg-green-100 hover:bg-green-200 text-green-800'
      : 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <Button
        onClick={handleFollowToggle}
        disabled={isLoading || status === 'loading'}
        className={`
          ${buttonSizeClasses[size]}
          ${buttonVariantClasses[variant]}
          border
          transition-all
          duration-200
          min-w-[100px]
          font-medium
          rounded-full
          focus:ring-2
          focus:ring-green-500
          focus:ring-offset-2
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${isLoading ? 'animate-pulse' : ''}
        `}
        aria-label={isFollowing ? `Unfollow ${artistName}` : `Follow ${artistName}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {isFollowing ? 'Unfollowing...' : 'Following...'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isFollowing ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Following
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Follow
              </>
            )}
          </div>
        )}
      </Button>

      {showFollowerCount && stats && (
        <span className="text-xs text-gray-500 font-medium">
          {formatFollowerCount(stats.followerCount)} followers
        </span>
      )}

      {error && (
        <span className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}