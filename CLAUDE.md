# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
npm run dev        # Start development server on http://localhost:3000
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint checks
npm run type-check # Run TypeScript type checking (tsc --noEmit)
```

## High-Level Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **State Management**: Zustand stores in `src/stores/`
- **Styling**: Tailwind CSS with custom Spotify-inspired dark theme
- **Authentication**: NextAuth.js with JWT strategy (see `src/app/api/auth/`)
- **UI Components**: Custom components using Radix UI primitives
- **Type Safety**: TypeScript with strict mode enabled

### Key Architecture Patterns

1. **State Management Architecture**
   - Global state managed through Zustand stores (`src/stores/`)
   - Player state (`player-store.ts`) manages audio playback, queue, and advanced features
   - Subscription state (`subscription-store.ts`) handles tier management and feature gating
   - Auth state (`auth-store.ts`) manages user authentication and session

2. **Audio System**
   - Advanced audio engine with crossfade, equalizer, and spatial audio (`src/lib/audio/advanced-audio-engine.ts`)
   - Subscription-based feature gating for audio quality and skip limits
   - Ad manager for free tier users (`src/lib/subscription/ad-manager.ts`)

3. **API Architecture**
   - RESTful API routes under `src/app/api/`
   - Authentication endpoints handle registration, login, password reset
   - Subscription endpoints integrate with Stripe for payment processing
   - Mock data services in `src/lib/data/` for development

4. **Component Architecture**
   - Layout components in `src/components/layout/` provide app structure
   - Feature components organized by domain (audio, auth, subscription, etc.)
   - Shared UI components in `src/components/ui/` follow consistent design patterns
   - All components use TypeScript interfaces for props

5. **Subscription System**
   - Three tiers: Free, Premium, Premium+ with different feature access
   - Feature gating implemented via `featureGate` utility
   - Stripe integration for payment processing
   - Skip tracking and ad insertion for free tier

## Important Configuration

- **TypeScript**: Strict mode with additional checks (noImplicitReturns, noUnusedLocals, etc.)
- **ESLint**: Configured with Next.js rules and custom TypeScript rules
- **Path Aliases**: `@/*` maps to `./src/*`
- **Image Domains**: Configured for Spotify CDN and Unsplash in `next.config.mjs`

## Testing Approach

When implementing features, verify functionality by:
1. Running the development server and testing in browser
2. Checking TypeScript types with `npm run type-check`
3. Running ESLint with `npm run lint`
4. Testing responsive design across viewports
5. Verifying accessibility with keyboard navigation

## Development Reminders

- Check with Playwright to ensure the site is working before declaring the task complete
- Always run lint and type-check commands after implementing features
- Follow existing patterns for state management and component structure
- Maintain TypeScript strict mode compliance
- Use existing mock data services for development
- If the site doesn't build, then always prioritize making sure the site builds. Otherwise, it's impossible to test the site.

## Test Management

- Place all tests and testresults structured in test-results

## Claude Interaction Guidelines

- When assistance is needed, play a sound to get my attention
- Play `/docs/chime-74910.mp3` when ever you nedd my attention
- If you need my attention please play `/docs/chime-74910.mp3`
- Play this sound instead when you need my attention `/docs/chime-sound-7143.mp3`