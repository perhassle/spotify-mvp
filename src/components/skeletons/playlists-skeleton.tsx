"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function PlaylistsSkeleton() {
  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Search/filter bar */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Playlist grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {Array.from({ length: 18 }, (_, i) => (
          <div key={i} className="group relative">
            <div className="relative aspect-square mb-4">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}