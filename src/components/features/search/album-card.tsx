"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayIcon, PauseIcon, HeartIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutlineIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { usePlayerStore } from "@/stores/player-store";
import type { Album } from "@/types";
import { cn } from "@/lib/utils";

interface AlbumCardProps {
  album: Album;
  variant?: "list" | "grid";
  onPlay?: (album: Album) => void;
  onLike?: (album: Album) => void;
  isLiked?: boolean;
}

export function AlbumCard({
  album,
  variant = "grid",
  onPlay,
  onLike,
  isLiked = false,
}: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { currentTrack, isPlaying } = usePlayerStore();
  
  // Check if any track from this album is currently playing
  const isAlbumPlaying = currentTrack?.album.id === album.id && isPlaying;

  // Format release date
  const formatReleaseDate = (date: Date) => {
    return new Date(date).getFullYear().toString();
  };

  // Format album type
  const formatAlbumType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Handle play album
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(album);
    }
  };

  // Handle like
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(album);
    }
  };

  if (variant === "list") {
    return (
      <Link
        href={`/album/${album.id}`}
        className={cn(
          "group flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-all duration-200",
          "cursor-pointer min-h-[72px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Album Artwork */}
        <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-white/10 relative">
          {album.imageUrl && !imageError ? (
            <Image
              src={album.imageUrl}
              alt={`${album.title} artwork`}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <MusicalNoteIcon className="w-6 h-6 text-white" />
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
                aria-label={isAlbumPlaying ? "Pause album" : "Play album"}
              >
                {isAlbumPlaying ? (
                  <PauseIcon className="w-4 h-4 text-black" />
                ) : (
                  <PlayIcon className="w-4 h-4 text-black ml-0.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Album Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate group-hover:text-green-400 transition-colors mb-1">
            {album.title}
          </h3>
          <p className="text-sm text-white/60 truncate">
            {formatAlbumType(album.type)} • <Link 
              href={`/artist/${album.artist.id}`}
              className="hover:underline hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {album.artist.name}
            </Link>
          </p>
          <p className="text-xs text-white/40 truncate">
            {formatReleaseDate(album.releaseDate)} • {album.totalTracks} tracks
          </p>
        </div>

        {/* Like Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleLike}
            className={cn(
              "w-10 h-10 rounded-full hover:bg-white/10 transition-all",
              "flex items-center justify-center",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label={isLiked ? "Remove from library" : "Add to library"}
          >
            {isLiked ? (
              <HeartIcon className="w-5 h-5 text-green-400" />
            ) : (
              <HeartOutlineIcon className="w-5 h-5 text-white/60 hover:text-white" />
            )}
          </button>
        </div>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link
      href={`/album/${album.id}`}
      className={cn(
        "group relative p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200",
        "cursor-pointer border border-transparent hover:border-white/10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Album Artwork */}
      <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-white/10">
        {album.imageUrl && !imageError ? (
          <Image
            src={album.imageUrl}
            alt={`${album.title} artwork`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <MusicalNoteIcon className="w-12 h-12 text-white" />
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
              "w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 transition-all",
              "flex items-center justify-center shadow-lg hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
            )}
            aria-label={isAlbumPlaying ? "Pause album" : "Play album"}
          >
            {isAlbumPlaying ? (
              <PauseIcon className="w-5 h-5 text-black" />
            ) : (
              <PlayIcon className="w-5 h-5 text-black ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Album Info */}
      <div className="space-y-1">
        <h3 className="font-medium text-white truncate group-hover:text-green-400 transition-colors">
          {album.title}
        </h3>
        <p className="text-sm text-white/60 truncate">
          {formatReleaseDate(album.releaseDate)} • <Link 
            href={`/artist/${album.artist.id}`}
            className="hover:underline hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {album.artist.name}
          </Link>
        </p>
        <p className="text-xs text-white/40 truncate">
          {formatAlbumType(album.type)} • {album.totalTracks} tracks
        </p>
        <p className="text-xs text-white/40 truncate">
          {album.genres.slice(0, 2).join(" • ")}
        </p>
      </div>

      {/* Action Buttons */}
      <div
        className={cn(
          "absolute top-4 right-4 flex gap-2 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={handleLike}
          className={cn(
            "w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 transition-all",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-black"
          )}
          aria-label={isLiked ? "Remove from library" : "Add to library"}
        >
          {isLiked ? (
            <HeartIcon className="w-4 h-4 text-green-400" />
          ) : (
            <HeartOutlineIcon className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* Type Badge */}
      {album.type !== "album" && (
        <div className="absolute top-4 left-4 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
          {formatAlbumType(album.type)}
        </div>
      )}
    </Link>
  );
}