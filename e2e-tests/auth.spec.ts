import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('can navigate to sign up page', async ({ page }) => {
    // Click sign up button
    await page.getByRole('link', { name: 'Sign Up' }).first().click();
    
    // Verify we're on the sign up page
    await expect(page).toHaveURL(/.*auth\/register/);
    
    // Check for form elements
    await expect(page.getByRole('heading', { name: 'Join Spotify' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password').first()).toBeVisible();
  });

  test('can sign up with valid credentials', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign Up' }).first().click();
    
    // Fill out the form
    const testEmail = `test${Date.now()}@example.com`;
    await page.getByLabel('Email address').fill(testEmail);
    await page.getByLabel('Username').fill(`user${Date.now()}`);
    await page.getByLabel('Display name').fill('Test User');
    await page.getByLabel('Password').first().fill('Test123!');
    await page.getByLabel('Confirm password').fill('Test123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(auth\/login|$)/);
  });

  test('can navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign In' }).first().click();
    
    await expect(page).toHaveURL(/.*auth\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows validation errors for invalid input', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign Up' }).first().click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign up' }).click();
    
    // Wait a bit for validation to appear
    await page.waitForTimeout(500);
    
    // Check for validation messages - may show as red borders or error text
    const emailInput = page.getByLabel('Email address');
    const hasError = await emailInput.evaluate(el => {
      return el.getAttribute('aria-invalid') === 'true' || 
             el.classList.contains('border-red-500') ||
             ('validity' in el && (el as HTMLInputElement).validity?.valueMissing);
    });
    
    expect(hasError).toBeTruthy();
  });
});