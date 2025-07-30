# Critical Fixes Guide - Immediate Actions Required

## 1. Fix TypeScript Build Errors

### Issue: Missing NextResponse import
**File:** `src/app/api/auth/register/route.example.ts`
```typescript
// Add this import at the top:
import { NextResponse } from 'next/server';
```

### Issue: Missing override modifiers
**File:** `src/components/common/error-boundary.tsx`
```typescript
// Add 'override' keyword:
override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // existing code
}

override render() {
  // existing code
}
```

### Issue: Type errors in env-validator
**File:** `src/lib/env-validator.ts`
```typescript
// Fix the validation function:
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => { // Change 'errors' to 'issues'
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables. Check logs for details.');
    } else {
      console.warn('⚠️  Running in development mode with invalid environment variables');
      return {} as z.infer<typeof envSchema>; // Add return for all paths
    }
  }
}
```

## 2. Create Missing SEO Files

### Create robots.txt
**File:** `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /static/

Sitemap: https://your-domain.com/sitemap.xml
```

### Create manifest.json
**File:** `public/manifest.json`
```json
{
  "name": "Spotify MVP",
  "short_name": "Spotify",
  "description": "A modern music streaming platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#1ed760",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Create sitemap.xml (basic static version)
**File:** `public/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2025-01-29</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://your-domain.com/search</loc>
    <lastmod>2025-01-29</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://your-domain.com/pricing</loc>
    <lastmod>2025-01-29</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

## 3. Remove ESLint Ignore in Build

**File:** `next.config.mjs`
```javascript
const nextConfig = {
  eslint: {
    // Remove or comment out this section
    // ignoreDuringBuilds: true,
  },
  // rest of config
};
```

## 4. Add Web Vitals Monitoring

**File:** `src/app/layout.tsx`
```typescript
// Add this import
import { useReportWebVitals } from 'next/web-vitals';

// Add this component
function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics service
    console.log(metric);
    
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
  });
  
  return null;
}

// Add to layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <WebVitalsReporter />
        {/* existing components */}
      </body>
    </html>
  );
}
```

## 5. Quick Test Fixes

### Fix auth validation test imports
**File:** `src/lib/auth/validation.ts`
```typescript
// Add missing export
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(3).max(20),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});
```

## 6. Environment Variables Template

**File:** `.env.local.example`
```bash
# NextAuth
NEXTAUTH_SECRET=your-32-character-secret-here-minimum-length
NEXTAUTH_URL=http://localhost:3001

# Stripe (use test keys for development)
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (optional for MVP)
EMAIL_FROM=noreply@your-domain.com
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

## Quick Commands to Run

```bash
# 1. Fix TypeScript errors
npm run type-check

# 2. Fix ESLint warnings (auto-fix what's possible)
npm run lint -- --fix

# 3. Run tests to see current state
npm run test:ci

# 4. Try building after fixes
npm run build

# 5. Check production build locally
npm run start
```

## Priority Order

1. **Fix TypeScript build errors** - Without this, nothing works
2. **Create SEO files** - Quick wins for production readiness
3. **Remove ESLint ignore** - Ensure code quality in builds
4. **Fix failing tests** - Get to a stable test suite
5. **Add monitoring** - Essential for production visibility

Complete these fixes first before moving to the comprehensive improvements listed in the main audit report.