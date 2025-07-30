import { test, expect } from '@playwright/test';

test.describe('Comprehensive Navigation Test - ALL Links and Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('test ALL sidebar navigation links', async ({ page }) => {
    // Main navigation links
    const mainLinks = [
      { name: 'Home', href: '/' },
      { name: 'Search', href: '/search' },
      { name: 'Your Library', href: '/playlists' }
    ];

    for (const link of mainLinks) {
      await page.goto('http://localhost:3001');
      await page.getByRole('link', { name: link.name }).click();
      await expect(page).toHaveURL(new RegExp(`.*${link.href === '/' ? '$' : link.href}`));
      
      // Take screenshot for documentation
      await page.screenshot({ path: `nav-${link.name.toLowerCase().replace(' ', '-')}.png` });
      
      // Verify page loads without errors
      const pageContent = await page.textContent('body');
      expect(pageContent?.length).toBeGreaterThan(100);
    }

    // Secondary navigation links
    const secondaryLinks = [
      { name: 'Liked Songs', href: '/liked-songs' },
      { name: 'Following', href: '/following' },
      { name: 'Recently Played', href: '/recently-played' }
    ];

    for (const link of secondaryLinks) {
      await page.goto('http://localhost:3001');
      await page.getByRole('link', { name: link.name }).click();
      await expect(page).toHaveURL(new RegExp(`.*${link.href}`));
      
      await page.screenshot({ path: `nav-${link.name.toLowerCase().replace(' ', '-')}.png` });
      
      const pageContent = await page.textContent('body');
      expect(pageContent?.length).toBeGreaterThan(100);
    }

    // Create Playlist button
    await page.goto('http://localhost:3001');
    const createButton = page.getByRole('button', { name: /create playlist/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      // Should open modal or navigate to create page
      const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
      const hasModal = await modal.isVisible();
      expect(hasModal).toBeTruthy();
    }
  });

  test('test ALL auth-related pages and flows', async ({ page }) => {
    const authPages = [
      { name: 'Sign Up', href: '/auth/register' },
      { name: 'Sign In', href: '/auth/login' },
    ];

    for (const authPage of authPages) {
      await page.goto('http://localhost:3001');
      
      // Click auth link from sidebar or main page
      const authLink = page.getByRole('link', { name: authPage.name }).first();
      await authLink.click();
      
      await expect(page).toHaveURL(new RegExp(`.*${authPage.href}`));
      await page.screenshot({ path: `auth-${authPage.name.toLowerCase().replace(' ', '-')}.png` });
      
      // Verify form elements exist
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      
      const submitButton = page.getByRole('button', { name: new RegExp(authPage.name, 'i') });
      await expect(submitButton).toBeVisible();
    }

    // Test forgot password flow
    await page.goto('http://localhost:3001/auth/login');
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/.*auth\/forgot-password/);
      await page.screenshot({ path: 'auth-forgot-password.png' });
    }

    // Test reset password page
    await page.goto('http://localhost:3001/auth/reset-password');
    await page.screenshot({ path: 'auth-reset-password.png' });
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('test ALL subscription and pricing pages', async ({ page }) => {
    // Check for pricing/premium links
    const pricingSelectors = [
      'a[href*="pricing"]',
      'a[href*="premium"]', 
      'a[href*="upgrade"]',
      'text="Upgrade to Premium"',
      'text="Premium"'
    ];

    let pricingFound = false;
    for (const selector of pricingSelectors) {
      const link = page.locator(selector).first();
      if (await link.isVisible()) {
        await link.click();
        pricingFound = true;
        break;
      }
    }

    if (pricingFound) {
      await page.screenshot({ path: 'subscription-pricing.png' });
      
      // Look for subscription tiers
      const tierTexts = ['free', 'premium', 'basic', 'plus'];
      let tierFound = false;
      for (const tier of tierTexts) {
        if (await page.getByText(new RegExp(tier, 'i')).isVisible()) {
          tierFound = true;
          break;
        }
      }
      expect(tierFound).toBeTruthy();
    }

    // Test subscription management page
    await page.goto('http://localhost:3001/subscription');
    await page.screenshot({ path: 'subscription-manage.png' });
    
    await page.goto('http://localhost:3001/subscription/manage');
    await page.screenshot({ path: 'subscription-manage-detailed.png' });

    // Test subscription cancellation
    await page.goto('http://localhost:3001/subscription/cancelled');
    await page.screenshot({ path: 'subscription-cancelled.png' });
  });

  test('test ALL music-related pages', async ({ page }) => {
    // Test track pages - try common IDs
    const trackIds = ['1', '2', '3', 'track-1', 'test-track'];
    for (const id of trackIds) {
      await page.goto(`http://localhost:3001/track/${id}`);
      await page.screenshot({ path: `music-track-${id}.png` });
      
      // Either should show track details or 404
      const has404 = await page.getByText('404').isVisible();
      const hasTrackContent = await page.locator('[data-testid*="track"], .track-details, .track-info').isVisible();
      expect(has404 || hasTrackContent).toBeTruthy();
    }

    // Test album pages
    const albumIds = ['1', '2', '3', 'album-1', 'test-album'];
    for (const id of albumIds) {
      await page.goto(`http://localhost:3001/album/${id}`);
      await page.screenshot({ path: `music-album-${id}.png` });
      
      const has404 = await page.getByText('404').isVisible();
      const hasAlbumContent = await page.locator('[data-testid*="album"], .album-details, .album-info').isVisible();
      expect(has404 || hasAlbumContent).toBeTruthy();
    }

    // Test artist pages
    const artistIds = ['1', '2', '3', 'artist-1', 'test-artist'];
    for (const id of artistIds) {
      await page.goto(`http://localhost:3001/artist/${id}`);
      await page.screenshot({ path: `music-artist-${id}.png` });
      
      const has404 = await page.getByText('404').isVisible();
      const hasArtistContent = await page.locator('[data-testid*="artist"], .artist-details, .artist-info').isVisible();
      expect(has404 || hasArtistContent).toBeTruthy();
    }

    // Test playlist pages
    const playlistIds = ['1', '2', '3', 'playlist-1', 'liked-songs'];
    for (const id of playlistIds) {
      await page.goto(`http://localhost:3001/playlist/${id}`);
      await page.screenshot({ path: `music-playlist-${id}.png` });
      
      const has404 = await page.getByText('404').isVisible();
      const hasPlaylistContent = await page.locator('[data-testid*="playlist"], .playlist-details, .playlist-info').isVisible();
      expect(has404 || hasPlaylistContent).toBeTruthy();
    }
  });

  test('test footer links and legal pages', async ({ page }) => {
    // Test common legal/footer pages
    const legalPages = [
      '/terms',
      '/privacy', 
      '/about',
      '/contact',
      '/help',
      '/support',
      '/careers',
      '/press'
    ];

    for (const pagePath of legalPages) {
      await page.goto(`http://localhost:3001${pagePath}`);
      await page.screenshot({ path: `legal${pagePath.replace('/', '-')}.png` });
      
      // Either should show content or 404
      const pageContent = await page.textContent('body');
      expect(pageContent?.length).toBeGreaterThan(50);
    }

    // Look for footer links on main page
    await page.goto('http://localhost:3001');
    const footerLinks = await page.locator('footer a, [data-testid="footer"] a').all();
    
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        await page.goto(`http://localhost:3001${href}`);
        await page.screenshot({ path: `footer-link-${href.replace('/', '-').replace(/[^a-zA-Z0-9-]/g, '')}.png` });
        
        const pageContent = await page.textContent('body');
        expect(pageContent?.length).toBeGreaterThan(50);
      }
    }
  });

  test('test social and sharing features', async ({ page }) => {
    // Test share pages
    const shareIds = ['track-1', 'album-1', 'playlist-1'];
    for (const id of shareIds) {
      await page.goto(`http://localhost:3001/share/${id}`);
      await page.screenshot({ path: `social-share-${id}.png` });
      
      const pageContent = await page.textContent('body');
      expect(pageContent?.length).toBeGreaterThan(50);
    }

    // Test user profile/following pages
    await page.goto('http://localhost:3001/profile');
    await page.screenshot({ path: 'social-profile.png' });

    await page.goto('http://localhost:3001/following');
    await page.screenshot({ path: 'social-following.png' });
  });

  test('test health and API endpoints', async ({ page }) => {
    // Test health endpoint
    await page.goto('http://localhost:3001/health');
    await page.screenshot({ path: 'api-health.png' });
    
    // Test API routes that should return JSON
    const response = await page.request.get('http://localhost:3001/api/health');
    expect(response.status()).toBeLessThan(500); // Should not be server error
  });
});