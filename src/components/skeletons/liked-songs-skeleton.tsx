"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function LikedSongsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black">
      {/* Header with gradient background */}
      <div className="relative h-80 bg-gradient-to-b from-purple-800 to-purple-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-end p-8">
          <div className="flex items-end gap-6">
            {/* Liked songs cover skeleton */}
            <div className="w-56 h-56 bg-gradient-to-br from-purple-700 to-blue-300 rounded shadow-2xl flex items-center justify-center">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="pb-2">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-12 w-48 mb-4" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-gradient-to-b from-purple-900 to-black px-8 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Track list */}
      <div className="px-8 pb-32">
        {/* Filter/sort options */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="space-y-1">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded hover:bg-white/5">
              <Skeleton className="w-6 h-6" />
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-56 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}