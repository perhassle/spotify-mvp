/**
 * Keyboard navigation utilities for the home feed
 * Ensures WCAG 2.2 compliance for keyboard accessibility
 */

export class KeyboardNavigationManager {
  private focusableElements: NodeListOf<HTMLElement> | null = null;
  private currentFocusIndex = 0;

  constructor(private container: HTMLElement) {
    this.updateFocusableElements();
    this.setupKeyboardListeners();
  }

  private updateFocusableElements() {
    // Find all focusable elements within the container
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
    ].join(', ');

    this.focusableElements = this.container.querySelectorAll(focusableSelector);
  }

  private setupKeyboardListeners() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.focusableElements || this.focusableElements.length === 0) {
      return;
    }

    switch (event.key) {
      case 'Tab':
        // Let browser handle tab navigation naturally
        break;
      
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusNext();
        break;
      
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusPrevious();
        break;
      
      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;
      
      case 'End':
        event.preventDefault();
        this.focusLast();
        break;
      
      case 'Enter':
      case ' ':
        // Let the focused element handle activation
        break;
      
      case 'Escape':
        event.preventDefault();
        this.handleEscape();
        break;
    }
  }

  private focusNext() {
    if (!this.focusableElements) return;
    
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private focusPrevious() {
    if (!this.focusableElements) return;
    
    this.currentFocusIndex = this.currentFocusIndex === 0 
      ? this.focusableElements.length - 1 
      : this.currentFocusIndex - 1;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private focusFirst() {
    if (!this.focusableElements) return;
    
    this.currentFocusIndex = 0;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private focusLast() {
    if (!this.focusableElements) return;
    
    this.currentFocusIndex = this.focusableElements.length - 1;
    this.focusableElements[this.currentFocusIndex]?.focus();
  }

  private handleEscape() {
    // Close any open dropdowns or modals
    const activeDropdowns = this.container.querySelectorAll('[aria-expanded="true"]');
    activeDropdowns.forEach(dropdown => {
      dropdown.setAttribute('aria-expanded', 'false');
    });
  }

  public updateCurrentFocus(element: HTMLElement) {
    if (!this.focusableElements) return;
    
    const index = Array.from(this.focusableElements).indexOf(element);
    if (index !== -1) {
      this.currentFocusIndex = index;
    }
  }

  public refresh() {
    this.updateFocusableElements();
  }

  public destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

/**
 * Screen reader announcements for dynamic content changes
 */
export class ScreenReaderAnnouncer {
  private liveRegion!: HTMLElement;

  constructor() {
    this.createLiveRegion();
  }

  private createLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(this.liveRegion);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement to allow repeated identical messages
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  public announceRecommendationsLoaded(count: number, sectionName: string) {
    this.announce(`${count} new recommendations loaded in ${sectionName} section`);
  }

  public announceTrackPlaying(trackTitle: string, artistName: string) {
    this.announce(`Now playing: ${trackTitle} by ${artistName}`);
  }

  public announceRecommendationRefreshed(sectionName: string) {
    this.announce(`${sectionName} recommendations refreshed`);
  }
}

/**
 * Focus management for modals and overlays
 */
export class FocusTrap {
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previousActiveElement: HTMLElement | null = null;

  constructor(private container: HTMLElement) {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.updateFocusableElements();
    this.setupEventListeners();
    this.focusFirst();
  }

  private updateFocusableElements() {
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const elements = this.container.querySelectorAll(focusableSelector);
    this.focusableElements = Array.from(elements) as HTMLElement[];
    
    if (this.focusableElements.length > 0) {
      this.firstFocusableElement = this.focusableElements[0] || null;
      this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null;
    }
  }

  private setupEventListeners() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === this.firstFocusableElement) {
          event.preventDefault();
          this.lastFocusableElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === this.lastFocusableElement) {
          event.preventDefault();
          this.firstFocusableElement?.focus();
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.release();
    }
  }

  private focusFirst() {
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
  }

  public release() {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Return focus to the previously active element
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }
}

/**
 * Skip navigation for better accessibility
 */
export class SkipNavigation {
  private skipLinks: HTMLElement[] = [];

  constructor() {
    this.createSkipLinks();
  }

  private createSkipLinks() {
    const skipNav = document.createElement('div');
    skipNav.className = 'skip-navigation sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-white focus:p-4 focus:text-black';
    
    const skipToMain = this.createSkipLink('#main-content', 'Skip to main content');
    const skipToNav = this.createSkipLink('#main-navigation', 'Skip to navigation');
    const skipToPlayer = this.createSkipLink('#music-player', 'Skip to music player');
    
    skipNav.appendChild(skipToMain);
    skipNav.appendChild(skipToNav);
    skipNav.appendChild(skipToPlayer);
    
    document.body.insertBefore(skipNav, document.body.firstChild);
  }

  private createSkipLink(target: string, text: string): HTMLElement {
    const link = document.createElement('a');
    link.href = target;
    link.textContent = text;
    link.className = 'skip-link block p-2 bg-green-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-400';
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetElement = document.querySelector(target) as HTMLElement;
      if (targetElement) {
        targetElement.focus();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    return link;
  }
}

/**
 * Color contrast utilities for WCAG compliance
 */
export class ColorContrastChecker {
  static calculateLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0);
  }

  static calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1] || '0', 16),
      g: parseInt(result[2] || '0', 16),
      b: parseInt(result[3] || '0', 16)
    } : null;
  }

  static meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.calculateContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  static meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.calculateContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * Touch target size checker for mobile accessibility
 */
export class TouchTargetChecker {
  static readonly MIN_TARGET_SIZE = 44; // 44px minimum per WCAG 2.2

  static checkElement(element: HTMLElement): {
    meets: boolean;
    width: number;
    height: number;
    recommendations: string[];
  } {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Include padding in touch target calculation
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const paddingRight = parseFloat(computedStyle.paddingRight);
    
    const effectiveWidth = rect.width + paddingLeft + paddingRight;
    const effectiveHeight = rect.height + paddingTop + paddingBottom;
    
    const meets = effectiveWidth >= this.MIN_TARGET_SIZE && effectiveHeight >= this.MIN_TARGET_SIZE;
    
    const recommendations: string[] = [];
    if (effectiveWidth < this.MIN_TARGET_SIZE) {
      recommendations.push(`Increase width to at least ${this.MIN_TARGET_SIZE}px (currently ${Math.round(effectiveWidth)}px)`);
    }
    if (effectiveHeight < this.MIN_TARGET_SIZE) {
      recommendations.push(`Increase height to at least ${this.MIN_TARGET_SIZE}px (currently ${Math.round(effectiveHeight)}px)`);
    }
    
    return {
      meets,
      width: effectiveWidth,
      height: effectiveHeight,
      recommendations,
    };
  }

  static auditTouchTargets(container: HTMLElement = document.body): TouchTargetAuditResult[] {
    const interactiveElements = container.querySelectorAll([
      'button',
      'a[href]',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', '));

    const results: TouchTargetAuditResult[] = [];
    
    interactiveElements.forEach((element) => {
      const check = this.checkElement(element as HTMLElement);
      results.push({
        element: element as HTMLElement,
        ...check,
      });
    });
    
    return results;
  }
}

interface TouchTargetAuditResult {
  element: HTMLElement;
  meets: boolean;
  width: number;
  height: number;
  recommendations: string[];
}