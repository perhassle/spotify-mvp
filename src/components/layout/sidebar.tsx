"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  RectangleStackIcon,
  HeartIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  HeartIcon as HeartIconSolid,
  ClockIcon as ClockIconSolid,
} from "@heroicons/react/24/solid";

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
    href: "/library",
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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-black text-white transition-transform duration-300",
        "scrollbar-thin overflow-y-auto border-r border-gray-800",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-spotify-green flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-white">Spotify MVP</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = isActive ? item.activeIcon : item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:text-white",
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-800" />

          {/* Create Playlist Button */}
          <button
            className={cn(
              "flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-gray-300 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green",
            )}
          >
            <PlusIcon className="h-6 w-6" />
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
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-spotify-green",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:text-white",
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Playlists Section */}
          <div className="mt-6">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Recently Created
            </h3>
            <div className="space-y-1 text-sm text-gray-300">
              <div className="px-3 py-1 hover:text-white cursor-pointer">
                My Playlist #1
              </div>
              <div className="px-3 py-1 hover:text-white cursor-pointer">
                Liked from Radio
              </div>
              <div className="px-3 py-1 hover:text-white cursor-pointer">
                Discover Weekly
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 p-4">
          <div className="text-xs text-gray-400">
            <p>Made with Next.js</p>
            <p>© 2024 Spotify MVP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}