import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Comprehensive WCAG 2.2 Level AA accessibility test
test.describe('WCAG 2.2 Level AA Compliance', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage first
    await page.goto('http://localhost:3001');
  });

  test('Homepage should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Homepage should have proper main element', async ({ page }) => {
    const mainElement = page.locator('main#main-content');
    await expect(mainElement).toBeVisible();
  });

  test('All interactive elements should meet 44px touch target size', async ({ page }) => {
    // Test buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }

    // Test links
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const box = await link.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('Skip navigation links should work', async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeInViewport();
    
    // Focus skip link and verify it becomes visible
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
    
    // Click skip link and verify focus moves to main content
    await skipLink.click();
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('Authentication pages should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3001/auth/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login form should have proper ARIA live regions', async ({ page }) => {
    await page.goto('http://localhost:3001/auth/login');
    
    // Check for aria-live regions on error messages
    const errorElements = page.locator('[role="alert"]');
    await expect(errorElements.first()).toHaveAttribute('aria-live');
  });

  test('Search page should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3001/search');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Search page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3001/search');
    
    // Check for h1 element (even if screen reader only)
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    
    // Check that h2 elements don't come before h1
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingTexts = await headings.allTextContents();
    
    // First visible heading should be h1 or h2 level
    const firstHeading = headings.first();
    const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
    expect(['h1', 'h2']).toContain(tagName);
  });

  test('Keyboard navigation should work throughout the app', async ({ page }) => {
    // Test homepage keyboard navigation
    await page.keyboard.press('Tab');
    
    // Should be able to tab through all interactive elements
    const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    
    // Verify we can tab through elements
    for (let i = 0; i < Math.min(count, 10); i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Music player controls should be keyboard accessible', async ({ page }) => {
    // This test would need a way to trigger the music player to show
    // For now, just verify the structure exists
    await page.goto('http://localhost:3001/search');
    
    // Check if player controls exist and have proper ARIA labels
    const playerButtons = page.locator('[aria-label*="play"], [aria-label*="pause"], [aria-label*="next"], [aria-label*="previous"]');
    
    // If player is visible, test keyboard interaction
    if (await playerButtons.first().isVisible()) {
      await playerButtons.first().focus();
      await expect(playerButtons.first()).toBeFocused();
    }
  });

  test('All form inputs should have proper labels', async ({ page }) => {
    await page.goto('http://localhost:3001/auth/login');
    
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toHaveCount(1);
      } else {
        // Check for aria-label or aria-labelledby
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Color contrast should meet WCAG standards', async ({ page }) => {
    // This would typically be covered by axe-core, but we can add specific checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations specifically
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('All images should have proper alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Images should have alt text, aria-label, or be marked as decorative
      expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('Progress bars and sliders should have proper ARIA attributes', async ({ page }) => {
    // Look for range inputs and slider roles
    const sliders = page.locator('input[type="range"], [role="slider"]');
    const sliderCount = await sliders.count();
    
    for (let i = 0; i < sliderCount; i++) {
      const slider = sliders.nth(i);
      
      if (await slider.isVisible()) {
        // Check for required ARIA attributes
        const ariaLabel = await slider.getAttribute('aria-label');
        const ariaLabelledBy = await slider.getAttribute('aria-labelledby');
        const ariaValueNow = await slider.getAttribute('aria-valuenow');
        const ariaValueMin = await slider.getAttribute('aria-valuemin');
        const ariaValueMax = await slider.getAttribute('aria-valuemax');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        expect(ariaValueNow).toBeTruthy();
        expect(ariaValueMin).toBeTruthy(); 
        expect(ariaValueMax).toBeTruthy();
      }
    }
  });

  test('Screen reader navigation landmarks should be present', async ({ page }) => {
    // Check for proper landmark roles
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);
    
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveCountGreaterThanOrEqual(1);
    
    // Check for complementary content (sidebar)
    const complementary = page.locator('aside, [role="complementary"]');
    if (await complementary.count() > 0) {
      await expect(complementary.first()).toBeVisible();
    }
  });

});