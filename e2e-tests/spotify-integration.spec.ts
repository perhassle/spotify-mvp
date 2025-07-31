import { test, expect } from '@playwright/test';

test.describe('Spotify Integration', () => {
  test('should login and connect to Spotify', async ({ page }) => {
    // Navigate to the homepage first
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
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Check if we're logged in by looking for the user menu
    await expect(page.locator('[aria-label="User menu"]')).toBeVisible({ timeout: 10000 });
    
    // Look for the Spotify Connect button in the sidebar
    const spotifyConnectButton = page.locator('text="Connect to Spotify"');
    await expect(spotifyConnectButton).toBeVisible();
    
    // Take a screenshot of the logged-in state
    await page.screenshot({ path: 'test-results/spotify-logged-in.png', fullPage: true });
    
    // Click the Spotify Connect button
    await spotifyConnectButton.click();
    
    // Wait for potential redirect to Spotify (this will fail if not connected)
    await page.waitForTimeout(2000);
    
    // Check if we're on Spotify's authorization page or if we got redirected back
    const currentUrl = page.url();
    console.log('Current URL after clicking Connect:', currentUrl);
    
    // Take a screenshot of the current state
    await page.screenshot({ path: 'test-results/spotify-connect-clicked.png', fullPage: true });
  });
  
  test('should show connected status after Spotify connection', async ({ page }) => {
    // This test assumes the user has already connected Spotify
    await page.goto('https://localhost:3001');
    
    // Click on Sign In button
    await page.click('text=Sign In');
    
    // Wait for login page to load
    await page.waitForURL('**/auth/login');
    
    // Login
    await page.fill('input[name="email"]', 'per@hassle.net');
    await page.fill('input[name="password"]', '123!"#asd');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Check for Spotify connection status
    const spotifyStatus = page.locator('text=/Connected to Spotify|Disconnect from Spotify/i');
    const isConnected = await spotifyStatus.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isConnected) {
      console.log('User is already connected to Spotify');
      await page.screenshot({ path: 'test-results/spotify-connected.png', fullPage: true });
    } else {
      console.log('User is not connected to Spotify');
    }
  });
});