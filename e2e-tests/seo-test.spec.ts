import { test, expect } from '@playwright/test';

test.describe('SEO Meta Tags and Structured Data', () => {
  test('should have comprehensive meta tags', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Basic meta tags
    await expect(page).toHaveTitle(/Spotify MVP - Your Music, Your Way/);
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Stream millions of songs');
    
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toContain('music streaming');
    
    // Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
    
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
    
    // Twitter Card tags
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');
    
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    expect(twitterTitle).toBeTruthy();
    
    // Canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://spotify-mvp.com');
    
    // Alternate languages
    const hrefLangEn = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
    expect(hrefLangEn).toBeTruthy();
    
    // Theme color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
    
    // Viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should have structured data', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    // Check for WebApplication schema in layout
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThan(0);
    
    let foundWebApp = false;
    let foundWebPage = false;
    
    for (const script of scripts) {
      const content = await script.textContent();
      if (content) {
        try {
          const json = JSON.parse(content);
          if (json['@type'] === 'WebApplication') {
            foundWebApp = true;
            expect(json.name).toBe('Spotify MVP');
            expect(json.applicationCategory).toBe('MultimediaApplication');
            expect(json.offers).toBeTruthy();
            expect(json.aggregateRating).toBeTruthy();
          }
          if (json['@type'] === 'WebPage') {
            foundWebPage = true;
            expect(json.name).toContain('Spotify MVP');
            expect(json.potentialAction).toBeTruthy();
          }
        } catch (e) {
          // Invalid JSON
        }
      }
    }
    
    expect(foundWebApp).toBe(true);
    expect(foundWebPage).toBe(true);
  });

  test('should have manifest.json link', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('/manifest.json');
  });

  test('should serve robots.txt', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/robots.txt');
    expect(response.status()).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Sitemap: https://spotify-mvp.com/sitemap.xml');
  });

  test('should serve sitemap.xml', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/sitemap.xml');
    expect(response.status()).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('<urlset');
    expect(content).toContain('https://spotify-mvp.com');
  });

  test('should serve manifest.json', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toBe('Spotify MVP - Music Streaming Platform');
    expect(manifest.short_name).toBe('Spotify MVP');
    expect(manifest.theme_color).toBe('#1ed760');
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have proper HTML lang attribute', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('should have preconnect links for performance', async ({ page }) => {
    await page.goto('http://localhost:3001');
    
    const preconnects = await page.locator('link[rel="preconnect"]').all();
    expect(preconnects.length).toBeGreaterThan(0);
    
    const preconnectHrefs = await Promise.all(
      preconnects.map(link => link.getAttribute('href'))
    );
    
    expect(preconnectHrefs).toContain('https://fonts.googleapis.com');
    expect(preconnectHrefs).toContain('https://i.scdn.co');
  });
});