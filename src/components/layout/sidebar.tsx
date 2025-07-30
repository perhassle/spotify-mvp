"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/social/notification-bell";
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  RectangleStackIcon,
  HeartIcon,
  ClockIcon,
  PlusIcon,
  MusicalNoteIcon,
  CreditCardIcon,
  StarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  HeartIcon as HeartIconSolid,
  ClockIcon as ClockIconSolid,
  StarIcon as StarIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from "@heroicons/react/24/solid";
import usePlaylistStore from "@/stores/playlist-store";
import CreatePlaylistModal from "@/components/features/playlist/create-playlist-modal";
import { useAuthStore } from "@/stores/auth-store";
import { TierManager } from "@/lib/subscription/tier-manager";

const mainNavItems = [
  {
    label: "Home",
    href: "/",
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    label: "Search",
    href: "/search",
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassIconSolid,
  },
  {
    label: "Your Library",
    href: "/playlists",
    icon: RectangleStackIcon,
    activeIcon: RectangleStackIconSolid,
  },
];

const libraryItems = [
  {
    label: "Liked Songs",
    href: "/liked-songs",
    icon: HeartIcon,
    activeIcon: HeartIconSolid,
  },
  {
    label: "Following",
    href: "/following",
    icon: UserGroupIcon,
    activeIcon: UserGroupIconSolid,
  },
  {
    label: "Recently Played",
    href: "/recently-played",
    icon: ClockIcon,
    activeIcon: ClockIconSolid,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { 
    playlists, 
    getUserPlaylists, 
    isLoading: playlistsLoading 
  } = usePlaylistStore();
  
  const userPlaylists = session?.user ? getUserPlaylists(session.user.id) : [];
  const recentPlaylists = userPlaylists
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const isPremiumUser = TierManager.isPremiumUser(user);
  const isInTrial = TierManager.isInTrial(user);

  return (
    <aside
      id="main-navigation"
      role="complementary"
      aria-label="Main navigation"
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-black text-white transition-transform duration-300",
        "scrollbar-thin overflow-y-auto border-r border-gray-800",
        "hidden md:block", // Hide on mobile, show on desktop
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Notifications */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-spotify-green flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-white">Spotify MVP</span>
          </Link>
          
          {session && <NotificationBell />}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4" role="navigation" aria-label="Primary navigation">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.activeIcon : item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                    "hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black",
                    "min-h-[44px] min-w-[44px]", // WCAG touch target size
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:text-white",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.label}${isActive ? " (current page)" : ""}`}
                >
                  <Icon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-800" />

          {/* Create Playlist Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className={cn(
              "flex w-full items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
              "text-gray-300 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black",
              "min-h-[44px]", // WCAG touch target size
            )}
            aria-label="Create a new playlist"
          >
            <PlusIcon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
            <span>Create Playlist</span>
          </button>

          {/* Library Items */}
          <div className="mt-4 space-y-1">
            {libraryItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.activeIcon : item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                    "hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black",
                    "min-h-[44px] min-w-[44px]", // WCAG touch target size
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:text-white",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${item.label}${isActive ? " (current page)" : ""}`}
                >
                  <Icon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Playlists Section */}
          {session?.user && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Recently Created
                </h3>
                {userPlaylists.length > 5 && (
                  <Link 
                    href="/playlists" 
                    className="text-xs text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Show all playlists"
                  >
                    Show all
                  </Link>
                )}
              </div>
              
              {playlistsLoading ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  Loading playlists...
                </div>
              ) : recentPlaylists.length > 0 ? (
                <div className="space-y-1 text-sm text-gray-300">
                  {recentPlaylists.map((playlist) => {
                    const isActive = pathname === `/playlist/${playlist.id}`;
                    
                    return (
                      <Link
                        key={playlist.id}
                        href={`/playlist/${playlist.id}`}
                        className={cn(
                          "flex items-center space-x-3 rounded-md px-3 py-3 transition-colors",
                          "hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black",
                          "min-h-[44px]", // WCAG touch target size
                          isActive
                            ? "bg-gray-900 text-white"
                            : "text-gray-300"
                        )}
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`${playlist.name} playlist${isActive ? " (current page)" : ""}`}
                      >
                        {playlist.imageUrl ? (
                          <img
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            className="h-4 w-4 rounded flex-shrink-0"
                          />
                        ) : (
                          <MusicalNoteIcon className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{playlist.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No playlists yet
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 p-4">
          {/* Subscription Status & Premium CTA */}
          {session?.user && (
            <div className="mb-4">
              {!isPremiumUser ? (
                <Link
                  href="/pricing"
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "bg-spotify-green text-black hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-spotify-green",
                  )}
                >
                  <StarIcon className="h-5 w-5" />
                  <span>Upgrade to Premium</span>
                </Link>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-yellow-900/20 text-yellow-400">
                    <StarIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {isInTrial ? 'Premium Trial' : TierManager.getTierDisplayName(user?.subscriptionTier || 'free')}
                    </span>
                  </div>
                  <Link
                    href="/subscription/manage"
                    className={cn(
                      "flex items-center space-x-3 rounded-md px-3 py-3 text-xs transition-colors",
                      "text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black",
                      "min-h-[44px]", // WCAG touch target size
                    )}
                    aria-label="Manage subscription settings"
                  >
                    <CreditCardIcon className="h-4 w-4" />
                    <span>Manage Subscription</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="mb-4">
            <UserMenu />
          </div>
          
          <div className="text-xs text-gray-400">
            <p>Made with Next.js</p>
            <p>© 2024 Spotify MVP</p>
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(playlistId) => {
          setIsCreateModalOpen(false);
          // Optional: Navigate to the new playlist
          // router.push(`/playlist/${playlistId}`);
        }}
      />
    </aside>
  );
}