import { test, expect } from '@playwright/test';

test('site is accessible', async ({ page }) => {
  // Try to load the site
  const response = await page.goto('http://localhost:3001', {
    waitUntil: 'domcontentloaded',
    timeout: 10000
  });
  
  // Check if we got a response
  expect(response?.status()).toBeLessThan(400);
  
  // Take a screenshot
  await page.screenshot({ path: 'site-check.png' });
  
  // Check if we're on login or home page
  const url = page.url();
  expect(url).toMatch(/localhost:3001\/(login|home|$)/);
});