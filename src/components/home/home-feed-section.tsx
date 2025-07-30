"use client";

import React, { useRef, useEffect } from 'react';
import { useHomeFeedStore } from '@/stores/home-feed-store';
import { RecommendationCard } from './recommendation-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw, MoreHorizontal } from 'lucide-react';
import type { HomeFeedSection } from '@/types';

interface HomeFeedSectionProps {
  section: HomeFeedSection;
  userId: string;
}

export function HomeFeedSection({ section, userId }: HomeFeedSectionProps) {
  const { refreshSection, refreshing, trackSectionView } = useHomeFeedStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTrackedView = useRef(false);

  // Track section view when it comes into viewport
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasTrackedView.current) {
              trackSectionView(section.id);
              hasTrackedView.current = true;
            }
          });
        },
        { threshold: 0.3 }
      );
    }

    const element = scrollContainerRef.current?.parentElement;
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [section.id, trackSectionView]);

  const handleRefresh = async () => {
    await refreshSection(userId, section.type);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = section.displaySettings.cardSize === 'large' ? 280 : 
                       section.displaySettings.cardSize === 'medium' ? 200 : 160;
      scrollContainerRef.current.scrollBy({
        left: -cardWidth * 2,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = section.displaySettings.cardSize === 'large' ? 280 : 
                       section.displaySettings.cardSize === 'medium' ? 200 : 160;
      scrollContainerRef.current.scrollBy({
        left: cardWidth * 2,
        behavior: 'smooth'
      });
    }
  };

  const isRefreshing = refreshing[section.type] || false;

  if (section.tracks.length === 0) {
    return null; // Don't render empty sections
  }

  return (
    <section 
      className="relative px-4 md:px-6"
      role="region"
      aria-labelledby={`section-${section.id}-title`}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex-1 min-w-0">
          <h2 
            id={`section-${section.id}-title`}
            className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate"
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
              {section.subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {section.refreshable && (
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="gap-2 min-w-0"
              disabled={isRefreshing}
              aria-label={`Refresh ${section.title}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="min-w-0"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content based on layout */}
      {section.displaySettings.layout === 'hero' ? (
        <HeroLayout section={section} userId={userId} />
      ) : section.displaySettings.layout === 'vertical_list' ? (
        <VerticalListLayout section={section} userId={userId} />
      ) : section.displaySettings.layout === 'grid' ? (
        <GridLayout section={section} userId={userId} />
      ) : (
        <HorizontalCardsLayout 
          section={section} 
          userId={userId}
          scrollContainerRef={scrollContainerRef}
          onScrollLeft={scrollLeft}
          onScrollRight={scrollRight}
        />
      )}
    </section>
  );
}

function HeroLayout({ section, userId }: { section: HomeFeedSection; userId: string }) {
  const featuredTrack = section.tracks[0];
  const otherTracks = section.tracks.slice(1, 6);

  if (!featuredTrack) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Featured Track */}
      <div className="lg:col-span-2">
        <RecommendationCard
          recommendation={featuredTrack}
          sectionId={section.id}
          userId={userId}
          size="hero"
          showReason={section.displaySettings.showRecommendationReason}
        />
      </div>
      
      {/* Side Tracks */}
      <div className="space-y-3">
        {otherTracks.map((track) => (
          <RecommendationCard
            key={track.trackId}
            recommendation={track}
            sectionId={section.id}
            userId={userId}
            size="compact"
            showReason={false}
          />
        ))}
      </div>
    </div>
  );
}

function VerticalListLayout({ section, userId }: { section: HomeFeedSection; userId: string }) {
  return (
    <div className="space-y-2">
      {section.tracks.map((track, index) => (
        <div key={track.trackId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <span className="text-sm text-gray-500 dark:text-gray-400 w-6 text-center">
            {index + 1}
          </span>
          <div className="flex-1">
            <RecommendationCard
              recommendation={track}
              sectionId={section.id}
              userId={userId}
              size="list"
              showReason={section.displaySettings.showRecommendationReason}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridLayout({ section, userId }: { section: HomeFeedSection; userId: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {section.tracks.map((track) => (
        <RecommendationCard
          key={track.trackId}
          recommendation={track}
          sectionId={section.id}
          userId={userId}
          size={section.displaySettings.cardSize}
          showReason={section.displaySettings.showRecommendationReason}
        />
      ))}
    </div>
  );
}

function HorizontalCardsLayout({ 
  section, 
  userId, 
  scrollContainerRef,
  onScrollLeft,
  onScrollRight
}: { 
  section: HomeFeedSection; 
  userId: string;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}) {
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  React.useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
    return undefined;
  }, [section.tracks]);

  return (
    <div className="relative group">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <Button
          onClick={onScrollLeft}
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-900/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full w-10 h-10 p-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}

      {/* Right Scroll Button */}
      {canScrollRight && (
        <Button
          onClick={onScrollRight}
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-900/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full w-10 h-10 p-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        } as React.CSSProperties}
        role="list"
        aria-label={`${section.title} recommendations`}
      >
        {section.tracks.map((track) => (
          <div 
            key={track.trackId}
            className="flex-shrink-0"
            role="listitem"
          >
            <RecommendationCard
              recommendation={track}
              sectionId={section.id}
              userId={userId}
              size={section.displaySettings.cardSize}
              showReason={section.displaySettings.showRecommendationReason}
            />
          </div>
        ))}
      </div>
    </div>
  );
}