# Performance Optimization Checklist

## Immediate Performance Wins

### 1. Enable Static Generation Where Possible
```typescript
// For static pages like pricing, about, etc.
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour
```

### 2. Optimize Images
```typescript
// Use Next.js Image component with proper sizing
import Image from 'next/image';

<Image
  src="/album-cover.jpg"
  alt="Album cover"
  width={300}
  height={300}
  placeholder="blur"
  blurDataURL={blurDataUrl}
  priority={isAboveFold}
/>
```

### 3. Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false // If not needed on server
});
```

### 4. Bundle Size Optimization
```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Add to next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### 5. Font Optimization
```typescript
// Current implementation is good, but add display swap
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Add this
});
```

### 6. Preconnect to External Domains
```typescript
// Add to layout.tsx head
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://i.scdn.co" />
<link rel="dns-prefetch" href="https://api.stripe.com" />
```

### 7. Resource Hints
```typescript
// Prefetch critical routes
import { useRouter } from 'next/navigation';

const router = useRouter();
// Prefetch common navigation targets
router.prefetch('/search');
router.prefetch('/playlists');
```

### 8. Lazy Load Non-Critical Resources
```typescript
// Lazy load analytics and monitoring
if (typeof window !== 'undefined') {
  import('./analytics').then(({ initAnalytics }) => {
    initAnalytics();
  });
}
```

### 9. Optimize Third-Party Scripts
```typescript
// Load Stripe only when needed
const loadStripe = () => {
  return import('@stripe/stripe-js').then(({ loadStripe }) => 
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)
  );
};
```

### 10. Enable Compression
```javascript
// next.config.mjs
module.exports = {
  compress: true, // This is enabled by default
  // Add custom headers for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## Performance Budgets

Add to `next.config.mjs`:
```javascript
module.exports = {
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FID', 'FCP', 'TTFB'],
  },
};
```

## Monitoring Script

Create `scripts/check-performance.js`:
```javascript
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
  
  if (performanceScore < 85) {
    console.error('Performance score below threshold!');
    process.exit(1);
  }
  
  await chrome.kill();
}

runLighthouse();
```

## Quick Wins Priority

1. **Remove blocking resources** - Check for render-blocking CSS/JS
2. **Enable text compression** - Already handled by Next.js
3. **Minimize main thread work** - Use Web Workers for heavy computations
4. **Reduce JavaScript execution time** - Code split and lazy load
5. **Serve static assets with efficient cache policy** - Configure headers
6. **Minimize critical request depth** - Flatten dependency chains
7. **Preload key requests** - Use link preload for critical resources
8. **Use passive listeners** - For scroll and touch events
9. **Avoid enormous network payloads** - Paginate and virtualize lists
10. **Serve images in next-gen formats** - Use WebP with fallbacks