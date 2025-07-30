"use client";

import Image from "next/image";
import Link from "next/link";
import { UserIcon, PlayIcon } from "@heroicons/react/24/solid";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import type { Artist } from "@/types";
import { cn } from "@/lib/utils";

interface ArtistCardProps {
  artist: Artist;
  variant?: "list" | "grid";
  onPlay?: (artist: Artist) => void;
  onFollow?: (artist: Artist) => void;
  isFollowing?: boolean;
}

export function ArtistCard({
  artist,
  variant = "grid",
  onPlay,
  onFollow,
  isFollowing = false,
}: ArtistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format follower count
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Handle play artist
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(artist);
    }
  };

  // Handle follow
  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFollow) {
      onFollow(artist);
    }
  };

  if (variant === "list") {
    return (
      <Link
        href={`/artist/${artist.id}`}
        className={cn(
          "group flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all duration-200",
          "cursor-pointer min-h-[72px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Artist Image */}
        <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-white/10 relative">
          {artist.imageUrl && !imageError ? (
            <Image
              src={artist.imageUrl}
              alt={`${artist.name} photo`}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          )}
          
          {/* Play Button Overlay */}
          {isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button
                onClick={handlePlay}
                className={cn(
                  "w-8 h-8 rounded-full bg-green-500 hover:bg-green-400 transition-all",
                  "flex items-center justify-center shadow-lg hover:scale-105",
                  "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
                )}
                aria-label={`Play ${artist.name}`}
              >
                <PlayIcon className="w-4 h-4 text-black ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate group-hover:text-green-400 transition-colors">
              {artist.name}
            </h3>
            {artist.isVerified && (
              <CheckBadgeIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-white/60 truncate">
            Artist • {formatFollowers(artist.followers)} followers
          </p>
          <p className="text-xs text-white/40 truncate">
            {artist.genres.slice(0, 3).join(" • ")}
          </p>
        </div>

        {/* Follow Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleFollow}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black",
              "min-h-[44px] min-w-[80px]", // Minimum touch target size
              isFollowing
                ? "bg-transparent border-white/20 text-white hover:border-white/40"
                : "bg-transparent border-white hover:border-green-400 text-white hover:text-green-400"
            )}
            aria-label={isFollowing ? `Unfollow ${artist.name}` : `Follow ${artist.name}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      href={`/artist/${artist.id}`}
      className={cn(
        "group relative p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200",
        "cursor-pointer border border-transparent hover:border-white/10 text-center"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Artist Image */}
      <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-white/10">
        {artist.imageUrl && !imageError ? (
          <Image
            src={artist.imageUrl}
            alt={`${artist.name} photo`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <UserIcon className="w-12 h-12 text-white" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <button
            onClick={handlePlay}
            className={cn(
              "w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 transition-all",
              "flex items-center justify-center shadow-lg hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label={`Play ${artist.name}`}
          >
            <PlayIcon className="w-6 h-6 text-black ml-1" />
          </button>
        </div>
      </div>

      {/* Artist Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-semibold text-lg text-white truncate group-hover:text-green-400 transition-colors">
            {artist.name}
          </h3>
          {artist.isVerified && (
            <CheckBadgeIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-sm text-white/60">
          Artist
        </p>
        
        <p className="text-xs text-white/40">
          {formatFollowers(artist.followers)} followers
        </p>
        
        <p className="text-xs text-white/40 truncate">
          {artist.genres.slice(0, 2).join(" • ")}
        </p>
      </div>

      {/* Follow Button */}
      <div className="mt-4">
        <button
          onClick={handleFollow}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all border",
            "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black",
            "min-h-[44px] min-w-[100px]", // Minimum touch target size
            isFollowing
              ? "bg-green-500 border-green-500 text-black hover:bg-green-400 hover:border-green-400"
              : "bg-transparent border-white hover:border-green-400 text-white hover:text-green-400"
          )}
          aria-label={isFollowing ? `Unfollow ${artist.name}` : `Follow ${artist.name}`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      {/* Popularity Badge */}
      {artist.popularity > 85 && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-green-500 text-black text-xs font-medium">
          Popular
        </div>
      )}
    </Link>
  );
}