import { test, expect } from '@playwright/test';

test('app is running and accessible', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3001');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'app-screenshot.png' });
  
  // Check that we get some content
  await expect(page).toHaveTitle(/.+/); // Any title
  
  // Log the page content for debugging
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  console.log('Page has content:', pageContent.length > 0);
  
  // Check for any visible text
  const bodyText = await page.textContent('body');
  console.log('Body text preview:', bodyText?.substring(0, 200));
});