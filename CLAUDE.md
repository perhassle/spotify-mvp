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

## Git Best Practices

- **Always keep commits small and focused** - easier to review and revert if needed
- **Commit frequently** - after each logical change or fix
- **One type of change per commit** - don't mix feature additions with bug fixes
- **ALWAYS verify before committing**:
  1. Run `npm run build` - must complete without errors
  2. Run `npm run dev` - site must load and function properly
  3. Test the specific feature/fix you implemented
  4. Only commit if everything works correctly
- **Examples of when to commit**:
  - After fixing a specific TypeScript error across multiple files AND verifying the build works
  - After implementing a single feature AND testing it in the browser
  - After fixing ESLint warnings in a component AND ensuring no regressions
  - After updating types or interfaces AND confirming no type errors
  - After refactoring a specific module AND testing functionality
- **Never accumulate many unrelated changes** - makes it hard to track what changed and why
- **Never commit broken code** - every commit should represent a working state

## Pull Request Workflow (Copilot Style)

When working on GitHub issues, follow this approach:

### 1. Create Draft PR with Plan
- Start with a **[WIP]** prefix in PR title
- Create PR as **DRAFT** status
- Include a plan with checkboxes in the PR description:
  ```markdown
  ## Plan: [Task Description]
  
  - [ ] Analyze current codebase and identify issues
  - [ ] Create implementation plan
  - [ ] Implement feature/fix
  - [ ] Add tests if applicable
  - [ ] Verify build and functionality
  - [ ] Update documentation
  
  **Current Status:** Initial analysis in progress...
  ```

### 2. Work Incrementally
- Start with analysis and understanding the problem
- Make small commits as you progress
- Update PR description with current status
- Check off completed items in the plan

### 3. PR Structure
```markdown
## Plan: [Title]

- [x] Completed task
- [ ] Pending task

**Current Status:** Brief description of where you are

**Changes Made:**
- List of changes as you make them

Fixes #[issue-number]
```

### 4. When to Convert from Draft
- Only when all checkboxes are complete
- Build passes without errors
- Feature is fully tested
- Remove [WIP] prefix from title
- Mark PR as "Ready for review"

## Test Management

- Place all tests and testresults structured in test-results

## Claude Interaction Guidelines

- When assistance is needed, play a sound to get my attention
- Play `/docs/chime-74910.mp3` when ever you nedd my attention
- If you need my attention please play `/docs/chime-74910.mp3`
- Play this sound instead when you need my attention `/docs/chime-sound-7143.mp3`