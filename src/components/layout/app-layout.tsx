"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load heavy components
const CompleteAudioPlayer = dynamic(
  () => import("@/components/audio/complete-audio-player").then(mod => ({ default: mod.CompleteAudioPlayer })),
  {
    ssr: false,
    loading: () => <div className="h-20 bg-zinc-900" aria-label="Loading music player..." />,
  }
);

const ShareModal = dynamic(
  () => import("@/components/social/share-modal").then(mod => ({ default: mod.ShareModal })),
  {
    ssr: false,
  }
);

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const pathname = usePathname();
  
  // Check if we're on an auth page or homepage
  const isAuthPage = pathname.startsWith('/auth');
  const isHomePage = pathname === '/';

  // For auth pages and homepage, don't show the sidebar and music player
  if (isAuthPage || isHomePage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // Regular app layout - Mobile-first responsive design
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Skip Navigation Links */}
      <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-0 focus-within:left-0 focus-within:z-50">
        <a 
          href="#main-content" 
          className="bg-green-600 text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Skip to main content
        </a>
        <a 
          href="#main-navigation" 
          className="bg-green-600 text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 ml-2"
        >
          Skip to navigation
        </a>
        <a 
          href="#music-player" 
          className="bg-green-600 text-white p-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 ml-2"
        >
          Skip to music player
        </a>
      </nav>

      {/* Mobile Navigation */}
      <MobileNavigation className="md:hidden" />
      
      {/* Desktop Sidebar Navigation */}
      <Sidebar className="hidden md:block" />

      {/* Main Content */}
      <main
        id="main-content"
        role="main"
        aria-label="Main content"
        className={cn(
          // Mobile-first styles
          "min-h-screen pt-14 pb-32 px-4", // Top nav + bottom nav + player space
          // Tablet and desktop styles
          "md:ml-64 md:pt-0 md:pb-24 md:px-6",
          // Scrolling behavior
          "overflow-y-auto md:scrollbar-thin",
          // Safe areas for iOS
          "safe-top safe-bottom",
          className,
        )}
      >
        {children}
      </main>

      {/* Enhanced Audio Player */}
      <section id="music-player" aria-label="Music player controls">
        <CompleteAudioPlayer />
      </section>

      {/* Share Modal */}
      <ShareModal />
    </div>
  );
}