import { test, expect } from '@playwright/test';

test.describe('Spotify Connect Test', () => {
  test('should login and click Connect Spotify button', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('https://localhost:3001');
    
    // Click on Sign In button
    await page.click('text=Sign In');
    
    // Wait for login page to load
    await page.waitForURL('**/auth/login');
    
    // Fill in login credentials
    await page.fill('input[name="email"]', 'per@hassle.net');
    await page.fill('input[name="password"]', '123!"#asd');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation();
    
    // Look for the Connect Spotify button
    const connectButton = page.locator('text="Connect Spotify"');
    await expect(connectButton).toBeVisible();
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-spotify-connect.png', fullPage: true });
    
    // Click the Connect Spotify button
    await connectButton.click();
    
    // Wait a bit for redirect
    await page.waitForTimeout(3000);
    
    // Check where we ended up
    const currentUrl = page.url();
    console.log('URL after clicking Connect Spotify:', currentUrl);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/after-spotify-connect.png', fullPage: true });
    
    // Check if we're on Spotify's auth page
    if (currentUrl.includes('accounts.spotify.com')) {
      console.log('Successfully redirected to Spotify OAuth page!');
      
      // Check for Spotify login form
      const spotifyLoginForm = page.locator('form#login-form, input[name="username"], text="Log in to Spotify"');
      const isOnSpotifyLogin = await spotifyLoginForm.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isOnSpotifyLogin) {
        console.log('Spotify login page detected');
      }
    } else if (currentUrl.includes('/spotify/connected')) {
      console.log('Already connected to Spotify!');
    } else if (currentUrl.includes('/spotify/error')) {
      console.log('Spotify connection error');
    }
  });
});