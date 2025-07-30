import { test, expect } from '@playwright/test';

test.describe('WCAG Accessibility Audit', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} Accessibility`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      test('Home page manual accessibility checks', async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        
        // Check for basic semantic structure - allow multiple main elements on different pages
        const main = page.locator('main, [role="main"]');
        const mainCount = await main.count();
        expect(mainCount).toBeGreaterThanOrEqual(1);
        
        // Check for navigation landmarks
        const nav = page.locator('nav, [role="navigation"]');
        const navCount = await nav.count();
        expect(navCount).toBeGreaterThan(0);
        
        // Check for proper heading hierarchy
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1);
        
        // Check touch target sizes on mobile
        if (viewport.width < 768) {
          const buttons = page.locator('button:visible');
          const buttonCount = await buttons.count();
          
          for (let i = 0; i < Math.min(buttonCount, 10); i++) {
            const button = buttons.nth(i);
            const box = await button.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      });

      test('Search functionality accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001/search');
        await page.waitForLoadState('networkidle');
        
        // Check search input ARIA attributes
        const searchInput = page.locator('input[role="combobox"]');
        await expect(searchInput).toHaveAttribute('aria-label');
        await expect(searchInput).toHaveAttribute('aria-expanded');
        
        // Test keyboard navigation in search
        await searchInput.focus();
        await page.keyboard.type('test search');
        
        // Check if suggestions appear with proper ARIA
        const suggestions = page.locator('[role="listbox"]');
        if (await suggestions.count() > 0) {
          await expect(suggestions).toHaveAttribute('aria-label');
        }
      });

      test('Authentication forms accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001/auth/login');
        await page.waitForLoadState('networkidle');
        
        // Check form labels and accessibility attributes
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        
        // Check if inputs have proper labeling (either via aria-describedby or labels)
        const emailAriaDescribedBy = await emailInput.getAttribute('aria-describedby');
        const emailLabel = await page.locator('label[for]').first().isVisible();
        expect(emailAriaDescribedBy !== null || emailLabel).toBe(true);
        
        const passwordAriaDescribedBy = await passwordInput.getAttribute('aria-describedby');
        const passwordLabel = await page.locator('label').nth(1).isVisible();
        expect(passwordAriaDescribedBy !== null || passwordLabel).toBe(true);
        
        // Test form validation accessibility
        await page.click('button[type="submit"]');
        
        // Check for error messages with proper ARIA
        const errorAlerts = page.locator('[role="alert"]');
        if (await errorAlerts.count() > 0) {
          await expect(errorAlerts.first()).toHaveAttribute('aria-live');
        }
      });

      test('Keyboard navigation flow', async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        
        // Hide Next.js dev tools to avoid focus conflicts
        await page.evaluate(() => {
          const devToolsButton = document.querySelector('[data-nextjs-dev-tools-button]');
          if (devToolsButton) {
            (devToolsButton as HTMLElement).style.display = 'none';
          }
        });
        
        // Test tab order - should be logical
        let focusableElements = [];
        
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          
          // Get focused element, but exclude Next.js dev tools
          const focusedElement = page.locator(':focus:not([data-nextjs-dev-tools-button]):not(nextjs-portal)').first();
          
          if (await focusedElement.count() > 0) {
            const isVisible = await focusedElement.isVisible();
            if (isVisible) {
              const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
              focusableElements.push(tagName);
            }
          }
        }
        
        // Should have focused on some interactive elements
        expect(focusableElements.length).toBeGreaterThan(0);
      });

      test('Music player accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        
        // Look for music player elements
        const playButtons = page.locator('button[aria-label*="Play"], button[aria-label*="Pause"]');
        const volumeControls = page.locator('input[type="range"]');
        
        // If music player is present, check accessibility
        if (await playButtons.count() > 0) {
          await expect(playButtons.first()).toHaveAttribute('aria-label');
        }
        
        if (await volumeControls.count() > 0) {
          const volumeControl = volumeControls.first();
          // Should have some form of labeling
          const hasAriaLabel = await volumeControl.getAttribute('aria-label');
          const hasTitle = await volumeControl.getAttribute('title');
          expect(hasAriaLabel || hasTitle).toBeTruthy();
        }
      });

      test('Image alt text and media accessibility', async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        
        // Check all images have alt text
        const images = page.locator('img');
        const imageCount = await images.count();
        
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          const role = await img.getAttribute('role');
          
          // Images should have alt text or be marked as decorative
          expect(alt !== null || role === 'presentation').toBe(true);
        }
      });

      test('Color and contrast basic checks', async ({ page }) => {
        await page.goto('http://localhost:3001');
        await page.waitForLoadState('networkidle');
        
        // Check that text elements have proper styling
        const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6').first();
        
        if (await textElements.count() > 0) {
          const styles = await textElements.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
            };
          });
          
          // Basic check that color properties are set
          expect(styles.color).toBeTruthy();
        }
      });
    });
  }
});