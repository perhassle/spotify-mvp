"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PlaylistSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header with gradient background */}
      <div className="relative h-80 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-end p-8">
          <div className="flex items-end gap-6">
            {/* Playlist cover skeleton */}
            <Skeleton className="w-56 h-56 rounded shadow-2xl" />
            <div className="pb-2">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-12 w-64 mb-4" />
              <Skeleton className="h-5 w-48 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-gradient-to-b from-gray-900 to-black px-8 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Track list */}
      <div className="px-8 pb-32">
        <div className="space-y-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded hover:bg-white/5">
              <Skeleton className="w-6 h-6" />
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-12" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}