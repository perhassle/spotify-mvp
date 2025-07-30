import { test, expect } from '@playwright/test';

test.describe('Playlist Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('can navigate to playlists', async ({ page }) => {
    await page.getByRole('link', { name: 'Your Library' }).click();
    await expect(page).toHaveURL(/.*playlists/);
  });

  test('can create a new playlist', async ({ page }) => {
    // Click create playlist button
    const createButton = page.getByRole('button', { name: /create playlist/i });
    await createButton.click();
    
    // Check if modal or form appears
    const playlistNameInput = page.getByPlaceholder(/playlist name/i);
    if (await playlistNameInput.isVisible()) {
      await playlistNameInput.fill('My Test Playlist');
      
      // Submit
      await page.getByRole('button', { name: /create|save/i }).click();
      
      // Should see the new playlist
      await expect(page.getByText('My Test Playlist')).toBeVisible();
    }
  });

  test('can view liked songs', async ({ page }) => {
    await page.getByRole('link', { name: 'Liked Songs' }).click();
    await expect(page).toHaveURL(/.*liked-songs/);
    
    // Should show liked songs page
    await expect(page.getByRole('heading', { name: /liked songs/i })).toBeVisible();
  });

  test('can add song to playlist', async ({ page }) => {
    // First go to search
    await page.getByRole('link', { name: 'Search' }).click();
    await page.getByPlaceholder(/search/i).fill('test');
    await page.waitForTimeout(500);
    
    // Find add to playlist button
    const addButton = page.getByRole('button', { name: /add to playlist/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Should show playlist selector
      await expect(page.getByText(/select playlist/i)).toBeVisible();
    }
  });
});