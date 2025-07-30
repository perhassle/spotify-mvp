import { test, expect } from '@playwright/test';

test.describe('Spotify MVP Full Test', () => {
  test('can navigate through the app', async ({ page }) => {
    // Go to home
    await page.goto('http://localhost:3001');
    await expect(page).toHaveTitle(/Spotify MVP/);
    
    // Test search navigation
    await page.getByRole('link', { name: 'Search' }).click();
    await expect(page).toHaveURL(/.*search/);
    
    // Test sign up flow
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/.*auth\/signup/);
    
    // Go back home
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('http://localhost:3001/');
    
    // Test sign in flow
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/.*auth\/signin/);
    
    // Check that the sidebar is visible
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Take final screenshot
    await page.screenshot({ path: 'app-navigation-test.png' });
  });
});