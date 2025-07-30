const { chromium } = require('playwright');
const { injectAxe, getViolations } = require('axe-playwright');

async function testAccessibility() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing Home Page Accessibility...');
    
    // Test Home Page
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
    
    const homeViolations = await getViolations(page, null, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
    });
    
    console.log(`\n=== HOME PAGE RESULTS ===`);
    console.log(`Found ${homeViolations.length} accessibility violations:\n`);
    
    if (homeViolations.length === 0) {
      console.log('🎉 No violations found! Home page is WCAG 2.2 Level AA compliant!');
    } else {
      homeViolations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.helpUrl}`);
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`   Element ${nodeIndex + 1}: ${node.target.join(' ')}`);
          if (node.failureSummary) {
            console.log(`   Issue: ${node.failureSummary}`);
          }
        });
        console.log('');
      });
    }

    // Test color contrast specifically
    const contrastViolations = await getViolations(page, null, {
      rules: ['color-contrast']
    });
    
    console.log(`\n=== COLOR CONTRAST ===`);
    console.log(`Found ${contrastViolations.length} color contrast violations`);
    if (contrastViolations.length === 0) {
      console.log('✅ All color contrast ratios meet WCAG AA standards!');
    }

    // Test touch target sizes
    console.log('\n=== TOUCH TARGET SIZES ===');
    const smallTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"]');
      const smallTargets = [];
      
      interactiveElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          smallTargets.push({
            index,
            tagName: element.tagName,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: element.textContent?.trim().substring(0, 30) || '',
            id: element.id || '',
            classes: element.className || ''
          });
        }
      });
      
      return smallTargets;
    });
    
    if (smallTargets.length === 0) {
      console.log('✅ All interactive elements meet 44x44px minimum touch target size!');
    } else {
      console.log(`Found ${smallTargets.length} elements smaller than 44x44px:`);
      smallTargets.forEach((target, index) => {
        console.log(`${index + 1}. ${target.tagName} (${target.width}x${target.height}px) - "${target.text}"`);
      });
    }

    console.log('\n=== ACCESSIBILITY SUMMARY ===');
    const totalViolations = homeViolations.length;
    const severityBreakdown = homeViolations.reduce((acc, violation) => {
      acc[violation.impact] = (acc[violation.impact] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`Total violations: ${totalViolations}`);
    if (totalViolations > 0) {
      console.log('Severity breakdown:', severityBreakdown);
    }
    
    const complianceScore = totalViolations === 0 ? 100 : Math.max(0, 100 - (totalViolations * 10));
    console.log(`WCAG 2.2 Level AA Compliance Score: ${complianceScore}/100`);
    
    if (totalViolations === 0) {
      console.log('\n🎉 CONGRATULATIONS! Your homepage achieves full WCAG 2.2 Level AA compliance!');
    } else {
      console.log(`\n⚠️  ${totalViolations} issues need to be resolved for full compliance.`);
    }
    
  } catch (error) {
    console.error('Error during accessibility testing:', error);
  } finally {
    await browser.close();
  }
}

testAccessibility();