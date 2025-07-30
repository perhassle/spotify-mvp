/**
 * Accessibility utilities for WCAG 2.2 compliance
 */

/**
 * Check if color contrast meets WCAG AA requirements
 * @param foreground Foreground color in hex format
 * @param background Background color in hex format
 * @returns Object with contrast ratio and compliance status
 */
export function checkColorContrast(foreground: string, background: string) {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Convert to relative luminance
    const toLinear = (c: number) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);

  const contrastRatio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                       (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: Math.round(contrastRatio * 100) / 100,
    passesAA: contrastRatio >= 4.5,
    passesAALarge: contrastRatio >= 3.0,
    passesAAA: contrastRatio >= 7.0,
  };
}

/**
 * Generate screen reader friendly text for music duration
 * @param seconds Duration in seconds
 * @returns Screen reader friendly duration text
 */
export function getAccessibleDurationText(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours} hours, ${minutes} minutes, and ${remainingSeconds} seconds`;
  }
  if (minutes > 0) {
    return `${minutes} minutes and ${remainingSeconds} seconds`;
  }
  return `${remainingSeconds} seconds`;
}

/**
 * Generate accessible label for play/pause buttons
 * @param isPlaying Current playing state
 * @param itemType Type of item (track, album, artist, playlist)
 * @param itemName Name of the item
 * @returns Accessible label text
 */
export function getPlayButtonLabel(
  isPlaying: boolean,
  itemType: 'track' | 'album' | 'artist' | 'playlist',
  itemName: string
): string {
  const action = isPlaying ? 'Pause' : 'Play';
  return `${action} ${itemName} ${itemType}`;
}

/**
 * Generate accessible text for popularity scores
 * @param popularity Popularity score (0-100)
 * @returns Screen reader friendly popularity text
 */
export function getAccessiblePopularityText(popularity: number): string {
  if (popularity >= 90) return 'Extremely popular';
  if (popularity >= 75) return 'Very popular';
  if (popularity >= 60) return 'Popular';
  if (popularity >= 40) return 'Moderately popular';
  return 'Less popular';
}

/**
 * Generate accessible text for follower counts
 * @param count Number of followers
 * @returns Screen reader friendly follower text
 */
export function getAccessibleFollowerText(count: number): string {
  if (count >= 1000000) {
    const millions = Math.floor(count / 1000000);
    const remainder = Math.floor((count % 1000000) / 100000);
    if (remainder === 0) {
      return `${millions} million followers`;
    }
    return `${millions}.${remainder} million followers`;
  }
  if (count >= 1000) {
    const thousands = Math.floor(count / 1000);
    const remainder = Math.floor((count % 1000) / 100);
    if (remainder === 0) {
      return `${thousands} thousand followers`;
    }
    return `${thousands}.${remainder} thousand followers`;
  }
  return `${count} followers`;
}

/**
 * Generate accessible text for track numbers
 * @param trackNumber Current track number
 * @param totalTracks Total tracks in album
 * @returns Screen reader friendly track position text
 */
export function getAccessibleTrackPositionText(
  trackNumber: number,
  totalTracks?: number
): string {
  if (totalTracks) {
    return `Track ${trackNumber} of ${totalTracks}`;
  }
  return `Track number ${trackNumber}`;
}

/**
 * Generate accessible text for explicit content
 * @returns Screen reader friendly explicit content warning
 */
export function getExplicitContentText(): string {
  return 'Contains explicit content';
}

/**
 * Generate accessible text for verified artists
 * @param artistName Name of the artist
 * @returns Screen reader friendly verified status
 */
export function getVerifiedArtistText(artistName: string): string {
  return `${artistName} is a verified artist`;
}

/**
 * Check if touch targets meet minimum size requirements (44x44 CSS pixels)
 * @param element HTML element to check
 * @returns Whether element meets minimum touch target size
 */
export function checkTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Generate live region announcement for music player state changes
 * @param isPlaying Current playing state
 * @param trackName Name of the track
 * @param artistName Name of the artist
 * @returns Live region announcement text
 */
export function getPlayerStateAnnouncement(
  isPlaying: boolean,
  trackName: string,
  artistName: string
): string {
  if (isPlaying) {
    return `Now playing: ${trackName} by ${artistName}`;
  }
  return `Paused: ${trackName} by ${artistName}`;
}

/**
 * Generate accessible description for album artwork
 * @param albumTitle Album title
 * @param artistName Artist name
 * @returns Alt text for album artwork
 */
export function getAlbumArtworkAltText(albumTitle: string, artistName: string): string {
  return `Album artwork for ${albumTitle} by ${artistName}`;
}

/**
 * Generate accessible description for artist photos
 * @param artistName Artist name
 * @returns Alt text for artist photo
 */
export function getArtistPhotoAltText(artistName: string): string {
  return `Photo of ${artistName}`;
}

/**
 * Generate accessible label for genre tags
 * @param genres Array of genre names
 * @returns Screen reader friendly genre list
 */
export function getAccessibleGenreText(genres: string[]): string {
  if (genres.length === 0) return '';
  if (genres.length === 1) return `Genre: ${genres[0]}`;
  if (genres.length === 2) return `Genres: ${genres.join(' and ')}`;
  
  const lastGenre = genres[genres.length - 1];
  const otherGenres = genres.slice(0, -1).join(', ');
  return `Genres: ${otherGenres}, and ${lastGenre}`;
}

/**
 * Generate accessible skip link text
 * @param targetId ID of the target element
 * @param description Description of what the link skips to
 * @returns Skip link text
 */
export function getSkipLinkText(targetId: string, description: string): string {
  return `Skip to ${description}`;
}

/**
 * Check if an element is currently visible and focusable
 * @param element HTML element to check
 * @returns Whether element is focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    !element.hasAttribute('disabled') &&
    element.tabIndex >= 0
  );
}

/**
 * Get the next focusable element in the DOM
 * @param currentElement Current focused element
 * @param direction Direction to search ('forward' or 'backward')
 * @returns Next focusable element or null
 */
export function getNextFocusableElement(
  currentElement: HTMLElement,
  direction: 'forward' | 'backward' = 'forward'
): HTMLElement | null {
  const focusableSelector = `
    a[href],
    button:not([disabled]),
    input:not([disabled]),
    select:not([disabled]),
    textarea:not([disabled]),
    [tabindex]:not([tabindex="-1"]):not([disabled])
  `;
  
  const focusableElements = Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter(isElementFocusable);
  
  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (direction === 'forward') {
    return focusableElements[currentIndex + 1] || focusableElements[0] || null;
  } else {
    return focusableElements[currentIndex - 1] || 
           focusableElements[focusableElements.length - 1] || null;
  }
}