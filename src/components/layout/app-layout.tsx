"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { MusicPlayer } from "./music-player";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-black text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={cn(
          "ml-64 h-full overflow-y-auto pb-20", // pb-20 for music player space
          "scrollbar-thin",
          className,
        )}
      >
        {children}
      </main>

      {/* Music Player */}
      <MusicPlayer />
    </div>
  );
}