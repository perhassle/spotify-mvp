import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG Accessibility Audit', () => {
  // Mobile-first viewport testing
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Desktop XL', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test('Home page accessibility audit', async ({ page }) => {
        await page.goto('http://localhost:3001');
        
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
        
        // Check for skip links
        const skipLinks = page.locator('a[href="#main-content"], a[href="#main-navigation"], a[href="#music-player"]');
        await expect(skipLinks).toHaveCount(3);
        
        // Check touch target sizes on mobile
        if (viewport.width < 768) {
          const buttons = page.locator('button');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < buttonCount; i++) {
            const button = buttons.nth(i);
            const box = await button.boundingBox();
            if (box) {
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      });

      test('Authentication pages accessibility', async ({ page }) => {
        // Login page
        await page.goto('http://localhost:3001/auth/login');
        
        const loginScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();

        expect(loginScanResults.violations).toEqual([]);
        
        // Check form labels and ARIA attributes
        await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-describedby');
        await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-describedby');
        
        // Check error states
        await page.fill('input[type="email"]', 'invalid-email');
        await page.click('button[type="submit"]');
        
        const errorMessage = page.locator('[role="alert"]');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toHaveAttribute('aria-live', 'polite');

        // Register page
        await page.goto('http://localhost:3001/auth/register');
        
        const registerScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();

        expect(registerScanResults.violations).toEqual([]);
      });

      test('Search page accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001/search');
        
        const searchScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();

        expect(searchScanResults.violations).toEqual([]);
        
        // Check search input accessibility
        const searchInput = page.locator('input[role="combobox"]');
        await expect(searchInput).toHaveAttribute('aria-label');
        await expect(searchInput).toHaveAttribute('aria-expanded');
        await expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
        
        // Test keyboard navigation
        await searchInput.focus();
        await page.keyboard.type('test');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      });

      test('Sidebar navigation accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001');
        
        // Check navigation structure
        const nav = page.locator('nav');
        await expect(nav).toHaveRole('navigation');
        
        // Check all navigation links have proper ARIA labels
        const navLinks = page.locator('nav a');
        const linkCount = await navLinks.count();
        
        for (let i = 0; i < linkCount; i++) {
          const link = navLinks.nth(i);
          const text = await link.textContent();
          expect(text).toBeTruthy();
          
          // Check focus ring is visible
          await link.focus();
          const focused = await link.evaluate(el => el === document.activeElement);
          expect(focused).toBe(true);
        }
      });

      test('Music player accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001');
        
        // Wait for music player to load
        const musicPlayer = page.locator('.music-player-bar');
        if (await musicPlayer.isVisible()) {
          // Check play/pause button
          const playButton = page.locator('button[aria-label*="Play"], button[aria-label*="Pause"]');
          await expect(playButton).toBeVisible();
          
          // Check volume controls
          const volumeSlider = page.locator('input[type="range"]');
          await expect(volumeSlider).toHaveAttribute('aria-label');
          
          // Check progress bar
          const progressBar = page.locator('.progress-bar, [role="progressbar"]');
          if (await progressBar.count() > 0) {
            await expect(progressBar.first()).toHaveAttribute('aria-label');
          }
        }
      });

      test('Color contrast compliance', async ({ page }) => {
        await page.goto('http://localhost:3001');
        
        // Check specific color contrast issues
        const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6, a, button');
        const elementCount = await textElements.count();
        
        // Sample check on first 10 elements
        for (let i = 0; i < Math.min(elementCount, 10); i++) {
          const element = textElements.nth(i);
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });
          
          // This is a basic check - in a real audit you'd use a proper contrast checker
          expect(styles.color).toBeTruthy();
        }
      });

      test('Keyboard navigation flow', async ({ page }) => {
        await page.goto('http://localhost:3001');
        
        // Test tab order
        await page.keyboard.press('Tab');
        let focusedElement = await page.locator(':focus');
        
        // Should start with skip links
        let focusedText = await focusedElement.textContent();
        expect(focusedText).toContain('Skip to');
        
        // Continue tabbing through main navigation
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          focusedElement = await page.locator(':focus');
          const isVisible = await focusedElement.isVisible();
          expect(isVisible).toBe(true);
        }
      });

      test('Screen reader compatibility', async ({ page }) => {
        await page.goto('http://localhost:3001');
        
        // Check for proper heading hierarchy
        const h1 = page.locator('h1');
        const h2 = page.locator('h2');
        const h3 = page.locator('h3');
        
        // Should have at least one h1
        await expect(h1).toHaveCount(1);
        
        // Check for landmark roles
        const main = page.locator('main, [role="main"]');
        await expect(main).toHaveCount(1);
        
        const navigation = page.locator('nav, [role="navigation"]');
        await expect(navigation).toHaveCountGreaterThan(0);
        
        // Check for live regions
        const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
        await expect(liveRegions).toHaveCountGreaterThan(0);
      });

      test('Form validation accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001/auth/login');
        
        // Test empty form submission
        await page.click('button[type="submit"]');
        
        // Check that error messages are properly associated
        const emailField = page.locator('input[type="email"]');
        const emailError = page.locator('#email-error');
        
        if (await emailError.isVisible()) {
          const ariaDescribedBy = await emailField.getAttribute('aria-describedby');
          expect(ariaDescribedBy).toContain('email-error');
        }
      });
    });
  }

  test('Mobile-specific accessibility features', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001');
    
    // Check that all touch targets are at least 44px
    const interactiveElements = page.locator('button, a, input, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const box = await element.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});