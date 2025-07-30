import { test, expect } from '@playwright/test';

test('Quick accessibility check', async ({ page }) => {
  // Check if server is running
  await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
  
  // Check page has loaded
  await expect(page.locator('h1')).toContainText('Spotify MVP');
  
  // Check basic keyboard navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toBeVisible();
  
  console.log('Basic accessibility check passed');
});