"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ArtistSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section with Artist Info */}
      <div className="relative h-96 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-end p-8">
          <div className="flex items-end gap-6">
            {/* Artist Image Skeleton */}
            <Skeleton className="w-56 h-56 rounded-full shadow-2xl" />
            <div className="pb-4">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-16 w-80 mb-4" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-gradient-to-b from-gray-900 to-black px-8 py-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-32 h-12 rounded-full" />
          <Skeleton className="w-32 h-10 rounded" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-8 pb-32 space-y-12">
        {/* Popular Tracks */}
        <div>
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded hover:bg-white/5">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="w-12 h-12 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-64 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Albums */}
        <div>
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="group">
                <Skeleton className="aspect-square rounded mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Related Artists */}
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-full aspect-square rounded-full mb-4" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}