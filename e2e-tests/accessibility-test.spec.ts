import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Compliance Tests', () => {
  test('Home page accessibility', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag22aa'])
      .analyze();
    
    // Log all violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Home page violations:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page accessibility', async ({ page }) => {
    await page.goto('http://localhost:3001/auth/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag22aa'])
      .analyze();
    
    // Log all violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Login page violations:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Search page accessibility', async ({ page }) => {
    await page.goto('http://localhost:3001/search');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag22aa'])
      .analyze();
    
    // Log all violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Search page violations:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Test skip link
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeFocused();
    
    // Test main navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const signInButton = await page.locator('a:has-text("Sign In")');
    await expect(signInButton).toBeFocused();
  });

  test('Focus management', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check focus indicators are visible
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    const focusOutline = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });
    
    // Ensure focus is visible (either outline or box-shadow)
    const hasFocusIndicator = 
      (focusOutline.outline !== 'none' && focusOutline.outlineWidth !== '0px') ||
      focusOutline.boxShadow.includes('ring');
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('Touch target sizes', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check all interactive elements meet 44x44 minimum
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();
    
    for (const element of interactiveElements) {
      const box = await element.boundingBox();
      if (box) {
        // Some elements might be hidden or have zero dimensions
        if (box.width > 0 && box.height > 0) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('Color contrast', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check text contrast
    const textElements = await page.locator('h1, h2, h3, h4, h5, h6, p, a, button, label').all();
    
    for (const element of textElements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        const contrast = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;
          
          // Simple check - in real test would use color contrast calculation
          return {
            background: bgColor,
            text: textColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          };
        });
        
        // Log for manual review
        console.log(`Element contrast - BG: ${contrast.background}, Text: ${contrast.text}, Size: ${contrast.fontSize}`);
      }
    }
  });
});