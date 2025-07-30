'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  HeartIcon,
  CalendarIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FollowButton } from '@/components/social/follow-button';
import { ArtistPhoto } from '@/components/common/optimized-image';
import { useSocialStore } from '@/stores/social-store';
import { usePlayerStore } from '@/stores/player-store';
import { formatNumberShort, formatDate } from '@/lib/format-utils';
import { FollowedArtist, Artist, FollowingFeedItem, ArtistFollowStats } from '@/types';

interface ExtendedFollowedArtist extends FollowedArtist {
  artist: Artist;
}

export default function FollowingPageClient() {
  const { data: session, status } = useSession();
  const { 
    followedArtists, 
    followingStats,
    isLoading, 
    error,
    fetchFollowedArtists,
    updateArtistStats
  } = useSocialStore();
  const { play } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'popular'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [feedItems, setFeedItems] = useState<FollowingFeedItem[]>([]);
  const [showFeed, setShowFeed] = useState(false);

  // Fetch followed artists on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFollowedArtists();
      fetchFollowingFeed();
    }
  }, [status, fetchFollowedArtists]);

  // Mock function to fetch following feed
  const fetchFollowingFeed = async () => {
    // This would normally be an API call
    const mockFeedItems: FollowingFeedItem[] = [
      {
        id: '1',
        type: 'new_release',
        artistId: '1',
        artist: {
          id: '1',
          name: 'The Weeknd',
          imageUrl: '/images/placeholder-artist.png',
          genres: ['Pop', 'R&B'],
          followers: 45000000,
          isVerified: true,
          popularity: 95
        },
        title: 'New Single: "Blinding Lights (Remix)"',
        description: 'The Weeknd just released a new remix of his hit single',
        imageUrl: '/images/placeholder-album.png',
        releaseDate: new Date('2024-01-15'),
        trackId: 'track-1',
        createdAt: new Date('2024-01-15'),
        isRead: false
      },
      {
        id: '2',
        type: 'upcoming_show',
        artistId: '2',
        artist: {
          id: '2',
          name: 'Billie Eilish',
          imageUrl: '/images/placeholder-artist.png',
          genres: ['Pop', 'Alternative'],
          followers: 38000000,
          isVerified: true,
          popularity: 92
        },
        title: 'Concert Announcement',
        description: 'Billie Eilish announces world tour dates for 2024',
        createdAt: new Date('2024-01-14'),
        isRead: false
      }
    ];
    setFeedItems(mockFeedItems);
  };

  // Filter and sort followed artists
  const filteredAndSortedArtists = (followedArtists as ExtendedFollowedArtist[])
    .filter((followedArtist: ExtendedFollowedArtist) =>
      followedArtist.artist?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: ExtendedFollowedArtist, b: ExtendedFollowedArtist) => {
      switch (sortBy) {
        case 'alphabetical':
          return (a.artist?.name || '').localeCompare(b.artist?.name || '');
        case 'popular':
          const aStats = followingStats[a.artistId];
          const bStats = followingStats[b.artistId];
          return (bStats?.followerCount || 0) - (aStats?.followerCount || 0);
        case 'recent':
        default:
          return new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime();
      }
    });

  const handleFollowChange = (artistId: string, isFollowing: boolean, stats: ArtistFollowStats) => {
    updateArtistStats(artistId, stats);
    if (!isFollowing) {
      // Refresh the list to remove unfollowed artist
      fetchFollowedArtists();
    }
  };

  const handlePlayArtist = (artist: Artist) => {
    // Mock track for artist
    const mockTrack = {
      id: `${artist.id}-top-track`,
      title: `Top Track by ${artist.name}`,
      artist: artist,
      album: {
        id: `${artist.id}-album`,
        title: 'Greatest Hits',
        artist: artist,
        releaseDate: new Date(),
        totalTracks: 12,
        imageUrl: artist.imageUrl,
        genres: artist.genres,
        type: 'album' as const
      },
      duration: 210,
      previewUrl: '/audio/track-1.mp3',
      streamUrl: '/audio/track-1.mp3',
      isExplicit: false,
      popularity: 85,
      trackNumber: 1,
      genres: artist.genres,
      releaseDate: new Date(),
      imageUrl: artist.imageUrl
    };

    play(mockTrack);
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto" />
          <h1 className="text-2xl font-bold">Sign in to see your followed artists</h1>
          <p className="text-gray-400">Follow artists to get updates on new releases and concerts</p>
          <Link href="/auth/login">
            <Button className="bg-green-600 hover:bg-green-700">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="pt-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-8 animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-gray-800 rounded-lg"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      <div className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Following
              </h1>
              <p className="text-gray-400 text-lg">
                {followedArtists.length === 0 
                  ? "Start following artists to see their latest updates"
                  : `${followedArtists.length} artist${followedArtists.length !== 1 ? 's' : ''} followed`
                }
              </p>
            </div>

            {/* Toggle Feed/Artists View */}
            {followedArtists.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFeed(false)}
                  variant={!showFeed ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <UserGroupIcon className="w-4 h-4" />
                  Artists
                </Button>
                <Button
                  onClick={() => setShowFeed(true)}
                  variant={showFeed ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <MusicalNoteIcon className="w-4 h-4" />
                  Activity Feed
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {followedArtists.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <UserGroupIcon className="w-24 h-24 text-gray-600 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-4">No artists followed yet</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                When you follow artists, you'll see them here along with updates about new releases, concerts, and more.
              </p>
              <Link href="/search">
                <Button className="bg-green-600 hover:bg-green-700">
                  Discover Artists
                </Button>
              </Link>
            </div>
          )}

          {/* Activity Feed */}
          {showFeed && followedArtists.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Latest Updates</h2>
              
              {feedItems.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent updates from your followed artists</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <ArtistPhoto
                          src={item.artist.imageUrl}
                          alt={item.artist.name}
                          size="md"
                          className="flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{item.artist.name}</h3>
                            {item.artist.isVerified && (
                              <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                            )}
                            <span className="text-sm text-gray-400">
                              • {formatDate(item.createdAt, 'short')}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-medium text-white mb-2">{item.title}</h4>
                          <p className="text-gray-300 mb-4">{item.description}</p>
                          
                          {item.type === 'new_release' && item.trackId && (
                            <Button
                              onClick={() => handlePlayArtist(item.artist)}
                              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                              <PlayIcon className="w-4 h-4" />
                              Listen Now
                            </Button>
                          )}
                        </div>
                        
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Artists Grid */}
          {!showFeed && followedArtists.length > 0 && (
            <>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search followed artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="recent">Recently Followed</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  
                  <Button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    variant="outline"
                    className="px-3"
                  >
                    <FunnelIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Artists Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredAndSortedArtists.map((followedArtist: ExtendedFollowedArtist) => (
                    <div
                      key={followedArtist.id}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200 group"
                    >
                      <Link href={`/artist/${followedArtist.artistId}`} className="block">
                        <div className="relative mb-4">
                          <ArtistPhoto
                            src={followedArtist.artist?.imageUrl}
                            alt={followedArtist.artist?.name || 'Artist'}
                            size="xl"
                            className="aspect-square"
                          />
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handlePlayArtist(followedArtist.artist);
                            }}
                            className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 transition-all duration-200"
                            aria-label={`Play ${followedArtist.artist?.name}`}
                          >
                            <PlayIcon className="w-4 h-4 text-black ml-0.5" />
                          </button>
                        </div>
                      </Link>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/artist/${followedArtist.artistId}`}
                            className="font-semibold text-white hover:text-green-400 transition-colors truncate"
                          >
                            {followedArtist.artist?.name}
                          </Link>
                          {followedArtist.artist?.isVerified && (
                            <CheckBadgeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        {followingStats[followedArtist.artistId] && (
                          <p className="text-xs text-gray-400">
                            {formatNumberShort(followingStats[followedArtist.artistId]?.followerCount || 0)} followers
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Followed {formatDate(followedArtist.followedAt, 'short')}
                        </p>
                        
                        <FollowButton
                          artistId={followedArtist.artistId}
                          artistName={followedArtist.artist?.name}
                          size="sm"
                          variant="outline"
                          showFollowerCount={false}
                          onFollowChange={(isFollowing, stats) => 
                            handleFollowChange(followedArtist.artistId, isFollowing, stats)
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedArtists.map((followedArtist: ExtendedFollowedArtist) => (
                    <div
                      key={followedArtist.id}
                      className="flex items-center gap-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg hover:bg-gray-800/70 transition-colors group"
                    >
                      <ArtistPhoto
                        src={followedArtist.artist?.imageUrl}
                        alt={followedArtist.artist?.name || 'Artist'}
                        size="md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/artist/${followedArtist.artistId}`}
                            className="font-semibold text-white hover:text-green-400 transition-colors truncate"
                          >
                            {followedArtist.artist?.name}
                          </Link>
                          {followedArtist.artist?.isVerified && (
                            <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {followingStats[followedArtist.artistId] && (
                            <span>{formatNumberShort(followingStats[followedArtist.artistId]?.followerCount || 0)} followers</span>
                          )}
                          <span>Followed {formatDate(followedArtist.followedAt, 'short')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayArtist(followedArtist.artist)}
                          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`Play ${followedArtist.artist?.name}`}
                        >
                          <PlayIcon className="w-5 h-5" />
                        </button>
                        
                        <FollowButton
                          artistId={followedArtist.artistId}
                          artistName={followedArtist.artist?.name}
                          size="sm"
                          variant="outline"
                          showFollowerCount={false}
                          onFollowChange={(isFollowing, stats) => 
                            handleFollowChange(followedArtist.artistId, isFollowing, stats)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Search Results */}
              {filteredAndSortedArtists.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No artists found matching "{searchQuery}"</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}