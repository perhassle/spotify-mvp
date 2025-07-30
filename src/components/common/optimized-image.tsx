'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  'data-testid'?: string;
}

/**
 * Optimized image component with lazy loading, fallbacks, and accessibility features
 * Uses Next.js Image component for automatic optimization
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/images/placeholder-album.png',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  onLoad,
  onError,
  'data-testid': testId,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const imageSrc = imageError ? fallbackSrc : (src || fallbackSrc);

  return (
    <div className={cn("relative overflow-hidden", className)} data-testid={testId}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse"
          style={{ width, height }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Album artwork component with standard sizes and optimizations
 */
interface AlbumArtworkProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
}

const albumSizes = {
  xs: { width: 40, height: 40, className: 'w-10 h-10' },
  sm: { width: 64, height: 64, className: 'w-16 h-16' },
  md: { width: 128, height: 128, className: 'w-32 h-32' },
  lg: { width: 200, height: 200, className: 'w-50 h-50' },
  xl: { width: 300, height: 300, className: 'w-75 h-75' },
  full: { width: 400, height: 400, className: 'w-full h-full' },
};

export function AlbumArtwork({
  src,
  alt,
  size = 'md',
  className,
  priority = false,
  onClick,
  'data-testid': testId,
}: AlbumArtworkProps) {
  const { width, height, className: sizeClassName } = albumSizes[size];

  return (
    <div 
      className={cn(
        "relative rounded-md overflow-hidden shadow-lg",
        sizeClassName,
        onClick && "cursor-pointer hover:shadow-xl transition-shadow duration-200",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      data-testid={testId}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="rounded-md"
        sizes={`${width}px`}
      />
    </div>
  );
}

/**
 * Artist photo component with circular design
 */
interface ArtistPhotoProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
}

const artistSizes = {
  xs: { width: 32, height: 32, className: 'w-8 h-8' },
  sm: { width: 48, height: 48, className: 'w-12 h-12' },
  md: { width: 80, height: 80, className: 'w-20 h-20' },
  lg: { width: 120, height: 120, className: 'w-30 h-30' },
  xl: { width: 200, height: 200, className: 'w-50 h-50' },
};

export function ArtistPhoto({
  src,
  alt,
  size = 'md',
  className,
  priority = false,
  onClick,
  'data-testid': testId,
}: ArtistPhotoProps) {
  const { width, height, className: sizeClassName } = artistSizes[size];

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden shadow-lg",
        sizeClassName,
        onClick && "cursor-pointer hover:shadow-xl transition-shadow duration-200",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      data-testid={testId}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="rounded-full"
        sizes={`${width}px`}
        fallbackSrc="/images/placeholder-artist.png"
      />
    </div>
  );
}