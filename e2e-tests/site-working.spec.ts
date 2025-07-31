import { test, expect } from '@playwright/test';

test('site is working - login page accessible', async ({ page }) => {
  // Go to homepage
  await page.goto('http://localhost:3001');
  
  // Click Sign In
  await page.getByRole('link', { name: 'Sign In' }).click();
  
  // Should be on login page
  await expect(page).toHaveURL('http://localhost:3001/auth/login');
  
  // Check login form elements exist
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  
  // Take screenshot
  await page.screenshot({ path: 'login-page-working.png' });
});