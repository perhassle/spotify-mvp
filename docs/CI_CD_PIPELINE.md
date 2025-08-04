# CI/CD Pipeline Documentation

This document provides comprehensive information about the GitHub Actions CI/CD pipeline setup for the Spotify MVP project.

## Overview

The project has a complete CI/CD pipeline with three main workflows:

1. **`ci.yml`** - Continuous Integration (runs on PRs and pushes)
2. **`deploy.yml`** - Production Deployment (runs on main branch)
3. **`playwright.yml`** - E2E Testing (standalone workflow)

## Workflows

### 1. Continuous Integration (`ci.yml`)

Runs on pushes to `main`, `master`, `develop`, and all PR branches.

**Jobs:**
- **Lint** - ESLint and TypeScript checking
- **Test** - Unit tests with coverage reporting
- **E2E** - Playwright end-to-end tests (72 tests)
- **Build** - Production build verification
- **Security** - npm audit and Trivy security scanning

**Environment:**
- Node.js 18
- All jobs run in parallel except build (depends on lint, test, e2e)

### 2. Production Deployment (`deploy.yml`)

Runs on pushes to `main` branch only.

**Jobs:**
- **Deploy** - Deploys to Vercel production

### 3. Playwright Tests (`playwright.yml`)

Standalone E2E testing workflow for manual runs or additional testing.

**Jobs:**
- **Test** - Runs all Playwright tests with artifact uploads

## Required Environment Variables & Secrets

Add these secrets to GitHub repository settings (Settings → Secrets → Actions):

### Required for Build & Testing:
```
NEXTAUTH_SECRET=your-random-secret-string-here
NEXTAUTH_URL=https://your-app-domain.com
```

### Required for Vercel Deployment:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

### Optional but Recommended:
```
NEXT_PUBLIC_API_URL=https://your-api-endpoint.com
SENTRY_DSN=your-sentry-dsn
STRIPE_SECRET_KEY=your-stripe-secret-key
DATABASE_URL=your-database-connection-string
```

## Getting Vercel Secrets

1. **VERCEL_TOKEN**: 
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token with appropriate scope

2. **VERCEL_ORG_ID**: 
   - Go to Vercel Dashboard → Settings → General
   - Copy the "Team ID" or "Personal Account ID"

3. **VERCEL_PROJECT_ID**: 
   - Go to your project in Vercel Dashboard → Settings → General
   - Copy the "Project ID"

## Branch Protection Rules

Configure these protection rules for the `main` branch:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - **Required status checks:**
     - `Lint`
     - `Test` 
     - `E2E Tests`
     - `Build`
     - `Security Scan`

## Testing the Pipeline

### 1. Test CI Pipeline:
```bash
git checkout -b test-ci-pipeline
echo "// Test change" >> src/app/page.tsx
git add .
git commit -m "test: verify CI pipeline"
git push origin test-ci-pipeline
```

Create a PR and verify all checks pass.

### 2. Test Deployment:
Merge the PR to `main` and verify deployment to Vercel succeeds.

### 3. Test Playwright:
```bash
# Local testing
npm run test:e2e

# Manual workflow trigger
# Go to Actions → Playwright Tests → Run workflow
```

## Monitoring & Troubleshooting

### Common Issues:

1. **`npm ci` fails**
   - Ensure `package-lock.json` is committed
   - Check for package compatibility issues

2. **Build fails**
   - Verify all environment variables are set
   - Check TypeScript errors with `npm run type-check`

3. **Tests timeout**
   - Current timeout is 60 minutes for Playwright
   - Check test efficiency and network dependencies

4. **Vercel deploy fails**
   - Verify tokens and project IDs are correct
   - Check Vercel dashboard for deployment logs

### Performance Expectations:

- **CI Pipeline**: ~5-8 minutes total
  - Lint: ~1 minute
  - Test: ~1 minute  
  - E2E: ~3-5 minutes
  - Build: ~2 minutes
  - Security: ~1 minute

- **Deployment**: ~2-3 minutes
- **Playwright**: ~3-5 minutes

### Monitoring:

1. **GitHub Actions Tab**: Monitor workflow runs and failure rates
2. **Vercel Dashboard**: Monitor deployment status and performance
3. **Notifications**: Set up Slack/email notifications for failed builds

## Coverage Reporting

Current coverage thresholds:
- **Statements**: 0.25%
- **Branches**: 0.1%
- **Functions**: 0.25%
- **Lines**: 0.25%

Coverage reports are generated for every test run and can be downloaded as artifacts.

## Security

The pipeline includes:
- **npm audit** for dependency vulnerabilities
- **Trivy** for container/filesystem security scanning
- **SARIF upload** for GitHub Security tab integration

## GitFlow Integration

The pipeline works with the existing GitFlow validation:
- Feature branches target `develop`
- Release/hotfix branches target `main`
- All branches get CI checks
- Only `main` triggers production deployment

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [Jest Coverage](https://jestjs.io/docs/configuration#collectcoveragefrom-array)