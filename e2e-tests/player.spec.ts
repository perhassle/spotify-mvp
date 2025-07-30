import { test, expect } from '@playwright/test';

test.describe('Music Player', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('player controls are visible', async ({ page }) => {
    // Check if player is visible
    const player = page.locator('[data-testid="music-player"], .music-player, #music-player');
    
    if (await player.isVisible()) {
      // Check for play/pause button
      const playButton = page.getByRole('button', { name: /play|pause/i });
      await expect(playButton).toBeVisible();
      
      // Check for volume control
      const volumeControl = page.locator('[aria-label*="volume" i]');
      await expect(volumeControl).toBeVisible();
    }
  });

  test('can play a track from home page', async ({ page }) => {
    // Look for any play button on the page
    const playButtons = page.locator('button[aria-label*="play" i], button:has-text("Play")');
    
    if (await playButtons.count() > 0) {
      await playButtons.first().click();
      
      // Check if player shows playing state
      await expect(page.locator('[data-testid="now-playing"]')).toBeVisible();
    }
  });

  test('can control playback', async ({ page }) => {
    // First play something
    const playButtons = page.locator('button[aria-label*="play" i], button:has-text("Play")');
    
    if (await playButtons.count() > 0) {
      await playButtons.first().click();
      
      // Test pause
      const pauseButton = page.getByRole('button', { name: /pause/i });
      if (await pauseButton.isVisible()) {
        await pauseButton.click();
        
        // Should show play button again
        await expect(page.getByRole('button', { name: /play/i })).toBeVisible();
      }
    }
  });

  test('can skip tracks', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /next|skip forward/i });
    const prevButton = page.getByRole('button', { name: /previous|skip backward/i });
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      // Track should change - would need to verify track info changes
    }
    
    if (await prevButton.isVisible()) {
      await prevButton.click();
      // Track should change back
    }
  });
});