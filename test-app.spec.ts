import { test, expect } from '@playwright/test';

test.describe('Spotify MVP App Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Spotify/);
    
    // Check for main navigation elements
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check for the music player
    await expect(page.locator('[data-testid="music-player"]')).toBeVisible();
  });

  test('can navigate to search page', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Click on search link
    await page.getByRole('link', { name: /search/i }).click();
    
    // Verify we're on the search page
    await expect(page).toHaveURL(/.*search/);
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();
  });

  test('can play a song', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Find and click on a play button
    const playButton = page.locator('button[aria-label*="Play"]').first();
    await playButton.click();
    
    // Check that the player shows playing state
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
  });

  test('authentication flow', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Click on sign in button
    const signInButton = page.getByRole('button', { name: /sign in/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Check for auth page elements
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    }
  });
});