"use client";

import React from 'react';

export function HomeFeedSkeleton() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 animate-pulse">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32" />
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
        </div>
      </div>

      {/* Feed Content Skeleton */}
      <div className="pb-32 space-y-6 md:space-y-8">
        {/* Hero Section Skeleton */}
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <div className="h-6 md:h-8 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-2" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-64" />
            </div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Track */}
            <div className="lg:col-span-2">
              <div className="w-full h-64 md:h-80 bg-gray-300 dark:bg-gray-600 rounded-xl" />
            </div>
            
            {/* Side Tracks */}
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Cards Section Skeleton */}
        {Array.from({ length: 4 }, (_, sectionIndex) => (
          <div key={sectionIndex} className="px-4 md:px-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <div className="h-6 md:h-8 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48" />
              </div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
            </div>
            
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }, (_, cardIndex) => (
                <div key={cardIndex} className="flex-shrink-0 w-48">
                  <div className="w-48 h-48 bg-gray-300 dark:bg-gray-600 rounded-xl mb-3" />
                  <div className="p-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Vertical List Section Skeleton */}
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <div className="h-6 md:h-8 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-2" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-52" />
            </div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20" />
          </div>
          
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 w-6 text-center">
                  {i + 1}
                </div>
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}