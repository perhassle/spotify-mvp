'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlayIcon,
  PauseIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  UserPlusIcon,
  CheckBadgeIcon,
  MusicalNoteIcon,
  QueueListIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { AlbumArtwork, ArtistPhoto } from '@/components/common/optimized-image';
import { GenreTags } from '@/components/common/genre-tags';
import { SocialShareButtons } from '@/components/social/social-share-buttons';
import { FollowButton } from '@/components/social/follow-button';
import { usePlayerStore } from '@/stores/player-store';
import { formatDuration, formatDate, formatNumberShort } from '@/lib/format-utils';
import { ShareableContent, Track, Album, Playlist, Artist } from '@/types';

interface SharePreviewClientProps {
  contentType: 'track' | 'album' | 'playlist' | 'artist';
  contentId: string;
  referrer?: string;
}

export default function SharePreviewClient({
  contentType,
  contentId,
  referrer,
}: SharePreviewClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  
  const [content, setContent] = useState<Track | Album | Playlist | Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [showAppPrompt, setShowAppPrompt] = useState(false);

  // Track view
  useEffect(() => {
    trackView();
    fetchContent();
  }, [contentType, contentId]);

  // Show app download prompt for non-users after a delay
  useEffect(() => {
    if (!session) {
      const timer = setTimeout(() => {
        setShowAppPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [session]);

  const trackView = async () => {
    try {
      await fetch(`/api/share/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          referrer,
        }),
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${contentType}/${contentId}`);
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data);
      } else {
        setError(data.error || 'Content not found');
      }
    } catch (error) {
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (!content) return;

    if (contentType === 'track') {
      const track = content as Track;
      if (currentTrack?.id === track.id && isPlaying) {
        pause();
      } else {
        play(track);
      }
    } else if (contentType === 'album' || contentType === 'playlist') {
      const collection = content as Album | Playlist;
      const tracks = 'tracks' in collection ? collection.tracks : [];
      if (tracks && tracks.length > 0 && tracks[0]) {
        const firstTrack = 'track' in tracks[0] ? tracks[0].track : tracks[0];
        if (!firstTrack) return;
        play(firstTrack);
      }
    }
  };

  const handleLike = () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setIsLiked(!isLiked);
  };

  const getShareableContent = (): ShareableContent => {
    if (!content) {
      return {
        id: contentId,
        type: contentType,
        title: `${contentType} ${contentId}`,
        url: `/share/${contentType}/${contentId}`,
      };
    }

    const baseContent = {
      id: content.id,
      type: contentType,
      imageUrl: 'imageUrl' in content ? content.imageUrl : undefined,
      url: `/share/${contentType}/${contentId}`,
    };

    switch (contentType) {
      case 'track':
        const track = content as Track;
        return {
          ...baseContent,
          title: track.title,
          subtitle: track.artist.name,
          description: `Listen to "${track.title}" by ${track.artist.name}`,
        };
      case 'album':
        const album = content as Album;
        return {
          ...baseContent,
          title: album.title,
          subtitle: album.artist.name,
          description: `Check out the album "${album.title}" by ${album.artist.name}`,
        };
      case 'playlist':
        const playlist = content as Playlist;
        return {
          ...baseContent,
          title: playlist.name,
          subtitle: `By ${playlist.owner.displayName}`,
          description: playlist.description || `Discover music in "${playlist.name}"`,
        };
      case 'artist':
        const artist = content as Artist;
        return {
          ...baseContent,
          title: artist.name,
          subtitle: 'Artist',
          description: artist.bio || `Discover ${artist.name}'s music`,
        };
      default:
        return {
          ...baseContent,
          title: 'Spotify MVP',
          description: 'Discover new music on Spotify MVP',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <MusicalNoteIcon className="w-16 h-16 text-gray-400 mx-auto" />
          <h1 className="text-2xl font-bold">Content Not Found</h1>
          <p className="text-gray-400">{error || 'The shared content could not be found.'}</p>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shareableContent = getShareableContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      {/* Header with branding */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-green-500 font-bold text-xl">
            <MusicalNoteIcon className="w-6 h-6" />
            Spotify MVP
          </Link>
          
          {!session && (
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {session && (
            <Link href={`/${contentType}/${contentId}`}>
              <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2" size="sm">
                Open in App
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Content Display */}
      <div className="pt-12 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Track Preview */}
          {contentType === 'track' && (
            <TrackPreview
              track={content as Track}
              isPlaying={currentTrack?.id === content.id && isPlaying}
              isLiked={isLiked}
              onPlay={handlePlay}
              onLike={handleLike}
              hasSession={!!session}
            />
          )}

          {/* Album Preview */}
          {contentType === 'album' && (
            <AlbumPreview
              album={content as Album}
              onPlay={handlePlay}
              hasSession={!!session}
            />
          )}

          {/* Playlist Preview */}
          {contentType === 'playlist' && (
            <PlaylistPreview
              playlist={content as Playlist}
              onPlay={handlePlay}
              hasSession={!!session}
            />
          )}

          {/* Artist Preview */}
          {contentType === 'artist' && (
            <ArtistPreview
              artist={content as Artist}
              hasSession={!!session}
            />
          )}

          {/* Sharing Section */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <h3 className="text-xl font-semibold mb-6 text-center">Share This {contentType}</h3>
            <div className="flex justify-center">
              <SocialShareButtons
                content={shareableContent}
                size="lg"
                showLabels={true}
                platforms={['twitter', 'facebook', 'whatsapp', 'telegram', 'copy']}
                customMessage={`Check out this ${contentType}: ${shareableContent.title}`}
              />
            </div>
          </div>

          {/* App Download Prompt */}
          {showAppPrompt && !session && (
            <div className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Get the full experience</h3>
              <p className="mb-4 text-green-100">
                Sign up for free to save your music, create playlists, and discover new favorites.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/register">
                  <Button className="bg-white text-green-700 hover:bg-gray-100 font-semibold px-8">
                    Sign Up Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-700 px-8">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for track preview
function TrackPreview({
  track,
  isPlaying,
  isLiked,
  onPlay,
  onLike,
  hasSession,
}: {
  track: Track;
  isPlaying: boolean;
  isLiked: boolean;
  onPlay: () => void;
  onLike: () => void;
  hasSession: boolean;
}) {
  return (
    <div className="text-center space-y-8">
      <div className="relative inline-block">
        <AlbumArtwork
          src={track.imageUrl}
          alt={`${track.title} artwork`}
          size="xl"
          className="shadow-2xl"
        />
        
        <button
          onClick={onPlay}
          className="absolute bottom-4 right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition-all duration-200 shadow-lg"
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {isPlaying ? (
            <PauseIcon className="w-8 h-8 text-black" />
          ) : (
            <PlayIcon className="w-8 h-8 text-black ml-1" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-2">{track.title}</h1>
          <Link
            href={`/artist/${track.artist.id}`}
            className="text-xl text-gray-300 hover:text-white transition-colors"
          >
            {track.artist.name}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6">
          <span className="text-gray-400">{formatDuration(track.duration)}</span>
          {track.isExplicit && (
            <span className="bg-gray-400 text-black px-2 py-1 rounded text-xs font-semibold">
              EXPLICIT
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onLike}
            className={`p-3 rounded-full transition-all duration-200 ${
              isLiked
                ? 'text-green-500 hover:text-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
            aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-6 h-6" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
          </button>

          {hasSession && (
            <Link href={`/album/${track.album.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <QueueListIcon className="w-4 h-4" />
                View Album
              </Button>
            </Link>
          )}
        </div>

        {track.genres.length > 0 && (
          <GenreTags
            genres={track.genres}
            size="md"
            variant="subtle"
            className="justify-center"
          />
        )}
      </div>
    </div>
  );
}

// Component for album preview
function AlbumPreview({
  album,
  onPlay,
  hasSession,
}: {
  album: Album;
  onPlay: () => void;
  hasSession: boolean;
}) {
  return (
    <div className="text-center space-y-8">
      <div className="relative inline-block">
        <AlbumArtwork
          src={album.imageUrl}
          alt={`${album.title} artwork`}
          size="xl"
          className="shadow-2xl"
        />
        
        <button
          onClick={onPlay}
          className="absolute bottom-4 right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition-all duration-200 shadow-lg"
          aria-label="Play album"
        >
          <PlayIcon className="w-8 h-8 text-black ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-2">
            {album.type}
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-2">{album.title}</h1>
          <Link
            href={`/artist/${album.artist.id}`}
            className="text-xl text-gray-300 hover:text-white transition-colors"
          >
            {album.artist.name}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-gray-400">
          <span>{formatDate(album.releaseDate, 'year')}</span>
          <span>•</span>
          <span>{album.totalTracks} tracks</span>
        </div>

        {hasSession && (
          <Link href={`/album/${album.id}`}>
            <Button className="bg-green-600 hover:bg-green-700 px-8">
              View Full Album
            </Button>
          </Link>
        )}

        {album.genres.length > 0 && (
          <GenreTags
            genres={album.genres}
            size="md"
            variant="subtle"
            className="justify-center"
          />
        )}
      </div>
    </div>
  );
}

// Component for playlist preview
function PlaylistPreview({
  playlist,
  onPlay,
  hasSession,
}: {
  playlist: Playlist;
  onPlay: () => void;
  hasSession: boolean;
}) {
  return (
    <div className="text-center space-y-8">
      <div className="relative inline-block">
        <AlbumArtwork
          src={playlist.imageUrl}
          alt={`${playlist.name} playlist`}
          size="xl"
          className="shadow-2xl"
        />
        
        <button
          onClick={onPlay}
          className="absolute bottom-4 right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition-all duration-200 shadow-lg"
          aria-label="Play playlist"
        >
          <PlayIcon className="w-8 h-8 text-black ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-2">
            Playlist
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-2">{playlist.name}</h1>
          <p className="text-xl text-gray-300">
            By {playlist.owner.displayName}
          </p>
        </div>

        {playlist.description && (
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {playlist.description}
          </p>
        )}

        <div className="flex items-center justify-center gap-6 text-gray-400">
          <span>{playlist.trackCount} tracks</span>
          <span>•</span>
          <span>{formatDuration(playlist.totalDuration)}</span>
          {playlist.followers > 0 && (
            <>
              <span>•</span>
              <span>{formatNumberShort(playlist.followers)} followers</span>
            </>
          )}
        </div>

        {hasSession && (
          <Link href={`/playlist/${playlist.id}`}>
            <Button className="bg-green-600 hover:bg-green-700 px-8">
              View Full Playlist
            </Button>
          </Link>
        )}

        {playlist.tags.length > 0 && (
          <GenreTags
            genres={playlist.tags}
            size="md"
            variant="subtle"
            className="justify-center"
          />
        )}
      </div>
    </div>
  );
}

// Component for artist preview
function ArtistPreview({
  artist,
  hasSession,
}: {
  artist: Artist;
  hasSession: boolean;
}) {
  return (
    <div className="text-center space-y-8">
      <ArtistPhoto
        src={artist.imageUrl}
        alt={`${artist.name} photo`}
        size="xl"
        className="shadow-2xl mx-auto"
      />

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            {artist.isVerified && (
              <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
            )}
            <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
              Artist
            </p>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4">{artist.name}</h1>
        </div>

        <div className="flex items-center justify-center gap-6 text-gray-400">
          <span>{formatNumberShort(artist.followers)} followers</span>
        </div>

        {artist.bio && (
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {artist.bio}
          </p>
        )}

        <div className="flex items-center justify-center gap-4">
          {hasSession && (
            <FollowButton
              artistId={artist.id}
              artistName={artist.name}
              size="md"
              variant="default"
              showFollowerCount={false}
            />
          )}

          {hasSession && (
            <Link href={`/artist/${artist.id}`}>
              <Button variant="outline" className="px-8">
                View Artist Profile
              </Button>
            </Link>
          )}
        </div>

        {artist.genres.length > 0 && (
          <GenreTags
            genres={artist.genres}
            size="md"
            variant="subtle"
            className="justify-center"
          />
        )}
      </div>
    </div>
  );
}