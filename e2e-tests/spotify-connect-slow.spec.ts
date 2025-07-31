import { test, expect } from '@playwright/test';

test.describe('Spotify Connect Slow Test', () => {
  test('should slowly login and click Connect Spotify button', async ({ page }) => {
    // Set slower timeout for this test
    test.setTimeout(120000); // 2 minutes
    
    console.log('1. Navigating to homepage...');
    await page.goto('https://localhost:3001');
    await page.waitForTimeout(2000); // Wait 2 seconds
    
    console.log('2. Clicking Sign In button...');
    await page.click('text=Sign In');
    await page.waitForTimeout(2000);
    
    console.log('3. Waiting for login page...');
    await page.waitForURL('**/auth/login');
    await page.waitForTimeout(2000);
    
    console.log('4. Filling in email...');
    await page.fill('input[name="email"]', 'per@hassle.net');
    await page.waitForTimeout(1000);
    
    console.log('5. Filling in password...');
    await page.fill('input[name="password"]', '123!"#asd');
    await page.waitForTimeout(1000);
    
    console.log('6. Taking screenshot before login...');
    await page.screenshot({ path: 'test-results/slow-1-before-login.png', fullPage: true });
    await page.waitForTimeout(1000);
    
    console.log('7. Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('8. Waiting for navigation after login...');
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('9. Taking screenshot after login...');
    await page.screenshot({ path: 'test-results/slow-2-after-login.png', fullPage: true });
    
    console.log('10. Looking for Connect Spotify button...');
    const connectButton = page.locator('text="Connect Spotify"');
    await expect(connectButton).toBeVisible();
    await page.waitForTimeout(2000);
    
    console.log('11. Hovering over Connect Spotify button...');
    await connectButton.hover();
    await page.waitForTimeout(1000);
    
    console.log('12. Taking screenshot before clicking Connect Spotify...');
    await page.screenshot({ path: 'test-results/slow-3-before-spotify-connect.png', fullPage: true });
    await page.waitForTimeout(1000);
    
    console.log('13. Clicking Connect Spotify button...');
    await connectButton.click();
    await page.waitForTimeout(5000);
    
    console.log('14. Checking current URL...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    console.log('15. Taking final screenshot...');
    await page.screenshot({ path: 'test-results/slow-4-final-state.png', fullPage: true });
    
    if (currentUrl.includes('accounts.spotify.com')) {
      console.log('✅ Successfully redirected to Spotify OAuth page!');
      
      console.log('16. Waiting on Spotify login page...');
      await page.waitForTimeout(10000); // Wait 10 seconds
      
      console.log('17. Taking screenshot of Spotify page...');
      await page.screenshot({ path: 'test-results/slow-5-spotify-page.png', fullPage: true });
      
      console.log('18. Test complete - keeping browser open for 30 seconds...');
      await page.waitForTimeout(30000); // Keep open for 30 seconds
    } else {
      console.log('❌ Did not redirect to Spotify');
    }
    
    console.log('Test finished!');
  });
});