import { test, expect } from '@playwright/test';

test.use({
  // Ignore HTTPS errors for self-signed certificate
  ignoreHTTPSErrors: true
});

test.describe('HTTPS Site Test', () => {
  test('should access site via HTTPS', async ({ page }) => {
    // Go to HTTPS homepage
    await page.goto('https://localhost:3001');
    
    // Should redirect to home or show landing page
    await expect(page).toHaveURL(/https:\/\/localhost:3001/);
    
    // Check if we can see the sign in link
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'https-site-working.png' });
  });

  test('should navigate to login page via HTTPS', async ({ page }) => {
    // Go to HTTPS homepage
    await page.goto('https://localhost:3001');
    
    // Click Sign In
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    // Should be on login page with HTTPS
    await expect(page).toHaveURL('https://localhost:3001/auth/login');
    
    // Check login form elements
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'https-login-page.png' });
  });

  test('should login with test user via HTTPS', async ({ page }) => {
    // Go directly to login page
    await page.goto('https://localhost:3001/auth/login');
    
    // Fill login form
    await page.getByPlaceholder(/email/i).fill('per@hassle.net');
    await page.getByPlaceholder(/password/i).fill('123!#asd');
    
    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait a bit for response
    await page.waitForTimeout(2000);
    
    // Take screenshot of result
    await page.screenshot({ path: 'https-login-attempt.png' });
    
    // Check if we got an error or successful login
    const errorMessage = page.getByText(/invalid.*password/i);
    const homeUrl = page.url().includes('/home');
    
    if (await errorMessage.isVisible()) {
      console.log('Login failed - invalid credentials');
    } else if (homeUrl) {
      console.log('Login successful - redirected to home');
      // Look for Spotify connect option
      const spotifyElement = page.getByText(/spotify/i).first();
      if (await spotifyElement.isVisible({ timeout: 5000 })) {
        console.log('Spotify integration visible');
        await page.screenshot({ path: 'https-spotify-visible.png' });
      }
    }
  });
});