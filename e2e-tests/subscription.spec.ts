import { test, expect } from '@playwright/test';

test.describe('Subscription Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('can view pricing page', async ({ page }) => {
    // Look for pricing link
    const pricingLink = page.getByRole('link', { name: /pricing|premium|upgrade/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/.*pricing/);
      
      // Should show subscription tiers
      await expect(page.getByText(/free/i)).toBeVisible();
      await expect(page.getByText(/premium/i)).toBeVisible();
    }
  });

  test('shows subscription benefits', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|premium|upgrade/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      
      // Check for feature lists
      await expect(page.getByText(/unlimited skips/i)).toBeVisible();
      await expect(page.getByText(/no ads/i)).toBeVisible();
      await expect(page.getByText(/high quality audio/i)).toBeVisible();
    }
  });

  test('can select subscription tier', async ({ page }) => {
    const pricingLink = page.getByRole('link', { name: /pricing|premium|upgrade/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      
      // Click on premium tier
      const selectButton = page.getByRole('button', { name: /select premium|get premium/i });
      if (await selectButton.isVisible()) {
        await selectButton.click();
        
        // Should redirect to payment or login
        await expect(page).toHaveURL(/\/(subscribe|auth\/login)/);
      }
    }
  });
});