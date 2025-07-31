import { test, expect } from '@playwright/test';

test.describe('Basic Site Functionality', () => {
  test('should load homepage and navigate to login', async ({ page }) => {
    // Go to homepage
    await page.goto('http://localhost:3001');
    
    // Check if redirected to home or login
    await expect(page).toHaveURL(/\/(home|login)/);
    
    // If on home page, check for login button
    if (page.url().includes('/home')) {
      await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible();
    }
    
    // If on login page, check for form elements
    if (page.url().includes('/login')) {
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    }
  });

  test('should be able to login with test user', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3001/login');
    
    // Fill in login form
    await page.getByPlaceholder(/email/i).fill('per@hassle.net');
    await page.getByPlaceholder(/password/i).fill('123!#asd');
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to home after login
    await expect(page).toHaveURL('http://localhost:3001/home');
    
    // Check for user menu or profile indicator
    await expect(page.getByText(/Per Hassle|perhassle/i)).toBeVisible();
  });

  test('should show Spotify connect button when logged in', async ({ page }) => {
    // First login
    await page.goto('http://localhost:3001/login');
    await page.getByPlaceholder(/email/i).fill('per@hassle.net');
    await page.getByPlaceholder(/password/i).fill('123!#asd');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3001/home');
    
    // Look for Spotify connect button
    const spotifyButton = page.getByRole('button', { name: /connect.*spotify/i });
    await expect(spotifyButton).toBeVisible();
  });
});