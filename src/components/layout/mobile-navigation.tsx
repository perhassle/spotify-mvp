"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/social/notification-bell";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
  HeartIcon,
  UserGroupIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  RectangleStackIcon as RectangleStackIconSolid,
  HeartIcon as HeartIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from "@heroicons/react/24/solid";

interface MobileNavigationProps {
  className?: string;
}

const bottomNavItems = [
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
    label: "Library",
    href: "/playlists",
    icon: RectangleStackIcon,
    activeIcon: RectangleStackIconSolid,
  },
  {
    label: "Liked",
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
];

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Top Navigation Bar */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800 safe-top md:hidden",
          className
        )}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-spotify-green flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-white">Spotify MVP</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {session && <NotificationBell />}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-spotify-green",
                "transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              )}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            isMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Panel */}
        <nav
          className={cn(
            "absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black",
            "transform transition-transform duration-300 ease-out",
            "border-l border-gray-800 overflow-y-auto safe-top safe-bottom",
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="navigation"
          aria-label="Mobile menu"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-spotify-green",
                "transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              )}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User Section */}
          {session && (
            <div className="p-4 border-b border-gray-800">
              <UserMenu />
            </div>
          )}

          {/* Create Playlist */}
          <div className="p-4">
            <Link
              href="/playlists?create=true"
              className={cn(
                "flex items-center space-x-3 w-full px-4 py-3 rounded-lg",
                "bg-spotify-green text-black font-medium",
                "hover:bg-spotify-green-light transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-offset-2 focus:ring-offset-black"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Playlist</span>
            </Link>
          </div>

          {/* Additional Links */}
          <div className="px-4 pb-4">
            <Link
              href="/pricing"
              className={cn(
                "block px-4 py-3 rounded-lg text-sm font-medium",
                "text-gray-300 hover:text-white hover:bg-gray-800",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Upgrade to Premium
            </Link>
            <Link
              href="/subscription/manage"
              className={cn(
                "block px-4 py-3 rounded-lg text-sm font-medium",
                "text-gray-300 hover:text-white hover:bg-gray-800",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-spotify-green"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              Manage Subscription
            </Link>
          </div>
        </nav>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 bg-black border-t border-gray-800 safe-bottom md:hidden",
          className
        )}
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2",
                  "min-h-[44px] transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-spotify-green focus:ring-inset",
                  isActive ? "text-white" : "text-gray-400"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.label}${isActive ? " (current page)" : ""}`}
              >
                <Icon className="h-6 w-6 mb-1" aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}