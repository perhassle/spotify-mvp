"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TrackSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Track Header */}
      <div className="relative h-96 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center p-8">
          <div className="text-center max-w-4xl">
            {/* Track Cover */}
            <Skeleton className="w-80 h-80 rounded-lg shadow-2xl mx-auto mb-8" />
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-gradient-to-b from-gray-900 to-black px-8 py-6">
        <div className="flex items-center justify-center gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Track Details */}
      <div className="px-8 pb-32 max-w-4xl mx-auto">
        {/* Audio Features */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-12 w-16 mx-auto mb-2" />
                <Skeleton className="h-2 w-32 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Lyrics Preview */}
        <div className="mb-12">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="bg-gray-900/50 rounded-lg p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Similar Tracks */}
        <div>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded hover:bg-white/5">
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
    </div>
  );
}