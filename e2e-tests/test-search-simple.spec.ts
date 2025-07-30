import { test, expect } from '@playwright/test';

test('search page loads and shows search input', async ({ page }) => {
  await page.goto('http://localhost:3001/search');
  
  // Take screenshot
  await page.screenshot({ path: 'search-page.png' });
  
  // Check for search input - try different selectors
  const searchInput = page.getByPlaceholder(/search/i).or(
    page.getByRole('textbox', { name: /search/i })
  ).or(
    page.locator('input[type="search"]')
  ).or(
    page.locator('input[type="text"]').first()
  );
  
  await expect(searchInput).toBeVisible();
});