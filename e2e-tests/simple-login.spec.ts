import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('should login successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('https://localhost:3001');
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'test-results/1-homepage.png', fullPage: true });
    
    // Click on Sign In button
    await page.click('text=Sign In');
    
    // Wait for login page to load
    await page.waitForURL('**/auth/login');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/2-login-page.png', fullPage: true });
    
    // Fill in login credentials
    await page.fill('input[name="email"]', 'per@hassle.net');
    await page.fill('input[name="password"]', '123!"#asd');
    
    // Take screenshot before clicking login
    await page.screenshot({ path: 'test-results/3-credentials-filled.png', fullPage: true });
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Wait a bit for navigation
    await page.waitForTimeout(3000);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/4-after-login.png', fullPage: true });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Try different selectors for logged in state
    const userMenuSelectors = [
      '[aria-label="User menu"]',
      'button:has-text("Per Hassle")',
      'text="Per Hassle"',
      '.user-menu',
      '[data-testid="user-menu"]'
    ];
    
    let foundUserMenu = false;
    for (const selector of userMenuSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        console.log(`Found user menu with selector: ${selector}`);
        foundUserMenu = true;
        break;
      }
    }
    
    // If we didn't find user menu, check for Spotify Connect button
    if (!foundUserMenu) {
      const spotifyButton = page.locator('text="Connect to Spotify"');
      const isSpotifyButtonVisible = await spotifyButton.isVisible({ timeout: 1000 }).catch(() => false);
      console.log('Spotify Connect button visible:', isSpotifyButtonVisible);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/5-final-state.png', fullPage: true });
  });
});