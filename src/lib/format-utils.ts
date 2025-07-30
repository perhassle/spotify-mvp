/**
 * Utility functions for formatting music metadata
 */

/**
 * Formats duration from seconds to readable time format
 * @param seconds Duration in seconds
 * @returns Formatted time string (e.g., "3:45" or "1:23:45")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Formats a large number (like follower count) to human readable format
 * @param num Number to format
 * @returns Formatted string (e.g., "1.2M", "45.6K")
 */
export function formatNumberShort(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
}

/**
 * Formats a date to human readable format
 * @param date Date to format
 * @param format Format type ('short', 'long', 'year')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'year' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'year') {
    return dateObj.getFullYear().toString();
  }
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculates total duration for a list of tracks
 * @param tracks Array of tracks with duration property
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(tracks: { duration: number }[]): number {
  return tracks.reduce((total, track) => total + track.duration, 0);
}

/**
 * Formats popularity score to percentage
 * @param popularity Popularity score (0-100)
 * @returns Formatted percentage string
 */
export function formatPopularity(popularity: number): string {
  return `${Math.round(popularity)}%`;
}

/**
 * Truncates text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Formats track number with proper padding
 * @param trackNumber Track number
 * @param totalTracks Total number of tracks (for padding calculation)
 * @returns Formatted track number
 */
export function formatTrackNumber(trackNumber: number, totalTracks?: number): string {
  if (!totalTracks || totalTracks < 10) {
    return trackNumber.toString();
  }
  
  const padding = totalTracks >= 100 ? 3 : 2;
  return trackNumber.toString().padStart(padding, '0');
}

/**
 * Creates a readable list from array items
 * @param items Array of strings
 * @param maxItems Maximum items to show before truncating
 * @returns Formatted list string
 */
export function formatList(items: string[], maxItems: number = 3): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] || '';
  if (items.length === 2) return items.join(' and ');
  
  if (items.length <= maxItems) {
    return items.slice(0, -1).join(', ') + ', and ' + (items[items.length - 1] || '');
  }
  
  return items.slice(0, maxItems).join(', ') + ` and ${items.length - maxItems} more`;
}

/**
 * Gets relative time from now (e.g., "2 days ago", "1 month ago")
 * @param date Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  if (diffYears === 1) return '1 year ago';
  return `${diffYears} years ago`;
}