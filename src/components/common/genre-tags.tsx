'use client';

import { cn } from '@/lib/utils';

interface GenreTagsProps {
  genres: string[];
  maxTags?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  className?: string;
  onGenreClick?: (genre: string) => void;
  'data-testid'?: string;
}

const sizeStyles = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

const variantStyles = {
  default: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  subtle: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
};

/**
 * Component for displaying genre tags with optional click functionality
 * Supports different sizes, variants, and interactive states
 */
export function GenreTags({
  genres,
  maxTags = 3,
  size = 'md',
  variant = 'default',
  className,
  onGenreClick,
  'data-testid': testId,
}: GenreTagsProps) {
  if (!genres || genres.length === 0) {
    return null;
  }

  const displayGenres = genres.slice(0, maxTags);
  const remainingCount = genres.length - maxTags;

  return (
    <div 
      className={cn("flex flex-wrap gap-2", className)}
      data-testid={testId}
    >
      {displayGenres.map((genre, index) => (
        <GenreTag
          key={`${genre}-${index}`}
          genre={genre}
          size={size}
          variant={variant}
          onClick={onGenreClick}
          data-testid={`genre-tag-${genre.toLowerCase().replace(/\s+/g, '-')}`}
        />
      ))}
      
      {remainingCount > 0 && (
        <span 
          className={cn(
            "rounded-full font-medium transition-colors duration-200",
            sizeStyles[size],
            "bg-gray-100 text-gray-500"
          )}
          aria-label={`${remainingCount} more genres`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

interface GenreTagProps {
  genre: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  className?: string;
  onClick?: (genre: string) => void;
  'data-testid'?: string;
}

/**
 * Individual genre tag component
 */
function GenreTag({
  genre,
  size = 'md',
  variant = 'default',
  className,
  onClick,
  'data-testid': testId,
}: GenreTagProps) {
  const isClickable = Boolean(onClick);

  const handleClick = () => {
    if (onClick) {
      onClick(genre);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors duration-200",
        sizeStyles[size],
        variantStyles[variant],
        isClickable && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        className
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      aria-label={isClickable ? `Filter by ${genre} genre` : undefined}
      data-testid={testId}
    >
      {genre}
    </span>
  );
}

/**
 * Compact genre display for tight spaces
 */
interface CompactGenreDisplayProps {
  genres: string[];
  maxLength?: number;
  className?: string;
  separator?: string;
  'data-testid'?: string;
}

export function CompactGenreDisplay({
  genres,
  maxLength = 50,
  className,
  separator = ' • ',
  'data-testid': testId,
}: CompactGenreDisplayProps) {
  if (!genres || genres.length === 0) {
    return null;
  }

  const genreText = genres.join(separator);
  const displayText = genreText.length > maxLength 
    ? genreText.slice(0, maxLength).trim() + '...'
    : genreText;

  return (
    <span 
      className={cn("text-sm text-gray-500", className)}
      title={genreText}
      data-testid={testId}
    >
      {displayText}
    </span>
  );
}

/**
 * Genre filter component for search/browse pages
 */
interface GenreFilterProps {
  genres: string[];
  selectedGenres?: string[];
  onGenreToggle: (genre: string) => void;
  className?: string;
  'data-testid'?: string;
}

export function GenreFilter({
  genres,
  selectedGenres = [],
  onGenreToggle,
  className,
  'data-testid': testId,
}: GenreFilterProps) {
  return (
    <div 
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Genre filters"
      data-testid={testId}
    >
      {genres.map((genre) => {
        const isSelected = selectedGenres.includes(genre);
        
        return (
          <button
            key={genre}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
              isSelected
                ? "bg-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={() => onGenreToggle(genre)}
            aria-pressed={isSelected}
            data-testid={`genre-filter-${genre.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}