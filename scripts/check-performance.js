const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port
  };
  
  const runnerResult = await lighthouse('http://localhost:3001', options);
  
  const performanceScore = runnerResult.lhr.categories.performance.score * 100;
  
  console.log(`Performance score: ${performanceScore}`);
  console.log('\nMetrics:');
  console.log(`- First Contentful Paint: ${runnerResult.lhr.audits['first-contentful-paint'].displayValue}`);
  console.log(`- Largest Contentful Paint: ${runnerResult.lhr.audits['largest-contentful-paint'].displayValue}`);
  console.log(`- Time to Interactive: ${runnerResult.lhr.audits['interactive'].displayValue}`);
  console.log(`- Total Blocking Time: ${runnerResult.lhr.audits['total-blocking-time'].displayValue}`);
  console.log(`- Cumulative Layout Shift: ${runnerResult.lhr.audits['cumulative-layout-shift'].displayValue}`);
  console.log(`- Speed Index: ${runnerResult.lhr.audits['speed-index'].displayValue}`);
  
  if (performanceScore < 85) {
    console.error('\nPerformance score below threshold!');
    process.exit(1);
  }
  
  await chrome.kill();
}

runLighthouse().catch(err => {
  console.error('Error running Lighthouse:', err);
  process.exit(1);
});