'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlayIcon, 
  PauseIcon, 
  HeartIcon, 
  EllipsisHorizontalIcon,
  ShareIcon,
  UserPlusIcon,
  CheckBadgeIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, UserPlusIcon as UserPlusOutlineIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { 
  formatDuration, 
  formatDate, 
  formatNumberShort,
  calculateTotalDuration
} from '@/lib/format-utils';
import { ArtistPhoto, AlbumArtwork } from '@/components/common/optimized-image';
import { GenreTags } from '@/components/common/genre-tags';
import { SongMetadata } from '@/components/features/metadata/song-metadata';
import { FollowButton } from '@/components/social/follow-button';
import { usePlayerStore } from '@/stores/player-store';
import { useSocialStore, useShareModalStore } from '@/stores/social-store';
import type { Artist, Album, Track, ShareableContent, ArtistFollowStats } from '@/types';

interface ArtistDetails extends Artist {
  albums: Album[];
  topTracks: Track[];
  totalPlayTime: number;
  monthlyListeners: number;
}

interface ArtistDetailClientProps {
  artist: ArtistDetails;
}

/**
 * Client-side artist detail component with interactive features
 */
export default function ArtistDetailClient({ artist }: ArtistDetailClientProps) {
  const { currentTrack, isPlaying, play, pause, setQueue } = usePlayerStore();
  const { followingStats, updateArtistStats } = useSocialStore();
  const { openShareModal } = useShareModalStore();
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);
  const [artistStats, setArtistStats] = useState<ArtistFollowStats | null>(
    followingStats[artist.id] || null
  );

  const tracksToShow = showAllTracks ? artist.topTracks : artist.topTracks.slice(0, 5);
  const albumsToShow = showAllAlbums ? artist.albums : artist.albums.slice(0, 6);

  const isArtistPlaying = artist.topTracks.some(track => 
    currentTrack?.id === track.id && isPlaying
  );

  const handlePlayArtist = () => {
    if (artist.topTracks.length === 0) return;

    if (isArtistPlaying) {
      pause();
    } else {
      setQueue(artist.topTracks, 0);
      play(artist.topTracks[0]);
    }
  };

  const handlePlayTrack = (track: Track, trackIndex: number) => {
    setQueue(artist.topTracks, trackIndex);
    play(track);
  };

  const handleLikeTrack = (trackId: string) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  // Update local stats when store changes
  useEffect(() => {
    setArtistStats(followingStats[artist.id] || null);
  }, [followingStats, artist.id]);

  const handleFollowChange = (isFollowing: boolean, stats: ArtistFollowStats) => {
    setArtistStats(stats);
    updateArtistStats(artist.id, stats);
  };

  const handleShare = () => {
    const shareableContent: ShareableContent = {
      id: artist.id,
      type: 'artist',
      title: artist.name,
      subtitle: 'Artist',
      imageUrl: artist.imageUrl,
      description: artist.bio || `Discover ${artist.name} on Spotify MVP`,
      url: `/artist/${artist.id}`,
    };

    openShareModal(shareableContent);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black text-white">
      {/* Artist Header */}
      <div className="relative px-6 pt-20 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-6 lg:gap-8">
            {/* Artist Photo */}
            <div className="flex-shrink-0">
              <ArtistPhoto
                src={artist.imageUrl}
                alt={`${artist.name} photo`}
                size="xl"
                priority
                className="shadow-2xl"
              />
            </div>

            {/* Artist Information */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  {artist.isVerified && (
                    <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                  )}
                  <p className="text-sm font-medium uppercase tracking-wide text-purple-200">
                    Artist
                  </p>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-black leading-tight">
                  {artist.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-lg text-purple-200">
                  <span>{formatNumberShort(artistStats?.monthlyListeners || artist.monthlyListeners)} monthly listeners</span>
                  <span>•</span>
                  <span>{formatNumberShort(artistStats?.followerCount || artist.followers)} followers</span>
                </div>
              </div>

              {/* Genres */}
              {artist.genres.length > 0 && (
                <GenreTags
                  genres={artist.genres}
                  maxTags={4}
                  size="md"
                  variant="subtle"
                  className="justify-center lg:justify-start"
                />
              )}

              {/* Bio */}
              {artist.bio && (
                <p className="text-purple-100 max-w-2xl leading-relaxed">
                  {artist.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handlePlayArtist}
              className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full hover:bg-green-400 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label={isArtistPlaying ? "Pause artist's music" : "Play artist's music"}
            >
              {isArtistPlaying ? (
                <PauseIcon className="w-6 h-6 text-black" />
              ) : (
                <PlayIcon className="w-6 h-6 text-black ml-1" />
              )}
            </button>

            <FollowButton
              artistId={artist.id}
              artistName={artist.name}
              size="md"
              variant="outline"
              showFollowerCount={false}
              onFollowChange={handleFollowChange}
              className="text-white"
            />

            <button
              onClick={handleShare}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label="Share artist"
            >
              <ShareIcon className="w-8 h-8" />
            </button>

            <button
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              aria-label="More options"
            >
              <EllipsisHorizontalIcon className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Tracks Section */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Popular tracks</h2>
              {artist.topTracks.length > 5 && (
                <button
                  onClick={() => setShowAllTracks(!showAllTracks)}
                  className="text-purple-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  {showAllTracks ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {tracksToShow.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors duration-200 group"
                >
                  <div className="flex items-center justify-center w-6 text-gray-400 group-hover:hidden">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => handlePlayTrack(track, index)}
                    className="hidden group-hover:flex items-center justify-center w-6 h-6 text-white hover:text-green-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                    aria-label={currentTrack?.id === track.id && isPlaying ? "Pause track" : "Play track"}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <PauseIcon className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>

                  <AlbumArtwork
                    src={track.imageUrl}
                    alt={`${track.title} album artwork`}
                    size="sm"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-medium truncate",
                        currentTrack?.id === track.id ? "text-green-400" : "text-white"
                      )}>
                        {track.title}
                      </h4>
                      {track.isExplicit && (
                        <span className="text-xs bg-gray-400 text-black px-1.5 py-0.5 rounded">
                          E
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/album/${track.album.id}`}
                      className="text-sm text-gray-400 hover:text-purple-300 hover:underline transition-colors duration-200 truncate block"
                    >
                      {track.album.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLikeTrack(track.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black",
                        likedTracks.has(track.id) && "opacity-100",
                        likedTracks.has(track.id)
                          ? "text-green-500 hover:text-green-400"
                          : "text-gray-400 hover:text-white"
                      )}
                      aria-label={likedTracks.has(track.id) ? "Remove from liked songs" : "Add to liked songs"}
                    >
                      {likedTracks.has(track.id) ? (
                        <HeartIcon className="w-4 h-4" />
                      ) : (
                        <HeartOutlineIcon className="w-4 h-4" />
                      )}
                    </button>

                    <span className="text-sm text-gray-400 w-12 text-right">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Discography Section */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Discography</h2>
            {artist.albums.length > 6 && (
              <button
                onClick={() => setShowAllAlbums(!showAllAlbums)}
                className="text-purple-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {showAllAlbums ? 'Show less' : 'Show all'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {albumsToShow.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group"
              >
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 hover:bg-black/40 transition-all duration-200">
                  <AlbumArtwork
                    src={album.imageUrl}
                    alt={`${album.title} album artwork`}
                    size="full"
                    className="mb-4"
                  />
                  
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors duration-200 line-clamp-2">
                      {album.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatDate(album.releaseDate, 'year')} • {album.type}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Artist Stats */}
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">About</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">
                  {formatNumberShort(artistStats?.monthlyListeners || artist.monthlyListeners)}
                </div>
                <div className="text-gray-400">Monthly Listeners</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">
                  {formatNumberShort(artistStats?.followerCount || artist.followers)}
                </div>
                <div className="text-gray-400">Followers</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">
                  {artist.albums.length}
                </div>
                <div className="text-gray-400">Albums</div>
              </div>
            </div>

            {artist.bio && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Biography</h3>
                <p className="text-gray-300 leading-relaxed">
                  {artist.bio}
                </p>
              </div>
            )}

            {artist.genres.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Genres</h3>
                <GenreTags
                  genres={artist.genres}
                  size="lg"
                  variant="subtle"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}