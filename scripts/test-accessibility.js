const { chromium } = require('playwright');
const { injectAxe, checkA11y, getViolations } = require('axe-playwright');

async function testAccessibility() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing Home Page Accessibility...');
    
    // Test Home Page
    await page.goto('http://localhost:3001');
    await injectAxe(page);
    
    const homeViolations = await getViolations(page, null, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
    });
    
    console.log(`Home Page - Found ${homeViolations.length} accessibility violations:`);
    homeViolations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Tags: ${violation.tags.join(', ')}`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(`   Node ${nodeIndex + 1}: ${node.target.join(' ')}`);
        if (node.failureSummary) {
          console.log(`   Failure: ${node.failureSummary}`);
        }
      });
    });

    // Test Login Page
    console.log('\n\nTesting Login Page Accessibility...');
    await page.goto('http://localhost:3001/auth/login');
    await page.waitForSelector('form');
    
    const loginViolations = await getViolations(page, null, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
    });
    
    console.log(`Login Page - Found ${loginViolations.length} accessibility violations:`);
    loginViolations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Tags: ${violation.tags.join(', ')}`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(`   Node ${nodeIndex + 1}: ${node.target.join(' ')}`);
        if (node.failureSummary) {
          console.log(`   Failure: ${node.failureSummary}`);
        }
      });
    });

    // Check color contrast specifically
    console.log('\n\nTesting Color Contrast...');
    const contrastViolations = await getViolations(page, null, {
      tags: ['wcag2aa'],
      rules: ['color-contrast']
    });
    
    console.log(`Found ${contrastViolations.length} color contrast violations`);
    
    // Test keyboard navigation
    console.log('\n\nTesting Keyboard Navigation...');
    await page.goto('http://localhost:3001/auth/login');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`First tab focus: ${focused}`);
    
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Second tab focus: ${focused}`);
    
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`Third tab focus: ${focused}`);

    // Test for touch target sizes
    console.log('\n\nTesting Touch Target Sizes...');
    const smallTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"]');
      const smallTargets = [];
      
      interactiveElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          smallTargets.push({
            index,
            tagName: element.tagName,
            className: element.className,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: element.textContent?.trim().substring(0, 50) || ''
          });
        }
      });
      
      return smallTargets;
    });
    
    console.log(`Found ${smallTargets.length} elements smaller than 44x44px:`);
    smallTargets.forEach((target, index) => {
      console.log(`${index + 1}. ${target.tagName} (${target.width}x${target.height}px) - "${target.text}"`);
    });

    console.log('\n\nAccessibility test completed!');
    
  } catch (error) {
    console.error('Error during accessibility testing:', error);
  } finally {
    await browser.close();
  }
}

testAccessibility();