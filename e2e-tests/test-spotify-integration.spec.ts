import { test, expect } from '@playwright/test';

test.describe('Spotify Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('http://localhost:3001');
  });

  test('should login and see Spotify connect option', async ({ page }) => {
    // Click sign in
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    // Should be on login page
    await expect(page).toHaveURL('http://localhost:3001/auth/login');
    
    // Fill login form
    await page.getByPlaceholder(/email/i).fill('per@hassle.net');
    await page.getByPlaceholder(/password/i).fill('123!#asd');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation
    await page.waitForURL('http://localhost:3001/home', { timeout: 10000 });
    
    // Check for Spotify connect button in the UI
    const spotifyButton = page.getByText(/connect.*spotify/i).first();
    await expect(spotifyButton).toBeVisible({ timeout: 5000 });
    
    // Take screenshot
    await page.screenshot({ path: 'spotify-connect-visible.png' });
  });
});