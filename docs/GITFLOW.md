# GitFlow Workflow Guide

This repository follows the GitFlow branching model. All contributors must adhere to these guidelines.

## Branch Structure

### Main Branches (Protected)
- **`master`** - Production-ready code. Only accepts merges from `release/*` and `hotfix/*` branches.
- **`develop`** - Integration branch for features. Only accepts merges from `feature/*`, `release/*`, and `hotfix/*` branches.

### Supporting Branches
- **`feature/*`** - New features (branch from `develop`, merge to `develop`)
- **`release/*`** - Release preparation (branch from `develop`, merge to `master` and `develop`)
- **`hotfix/*`** - Emergency fixes (branch from `master`, merge to `master` and `develop`)

## Workflow Rules

### 1. Feature Development
```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Work on your feature
git add .
git commit -m "feat: add new feature"

# Push and create PR to develop
git push origin feature/your-feature-name
# Create PR: feature/your-feature-name -> develop
```

### 2. Release Process
```bash
# Start a release
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Bump version, update changelog, fix bugs
git add .
git commit -m "chore: prepare release v1.0.0"

# Push and create PRs
git push origin release/v1.0.0
# Create PR: release/v1.0.0 -> master
# After merge to master, create PR: release/v1.0.0 -> develop
```

### 3. Hotfix Process
```bash
# Start a hotfix
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug-fix

# Fix the issue
git add .
git commit -m "fix: resolve critical bug"

# Push and create PRs
git push origin hotfix/critical-bug-fix
# Create PR: hotfix/critical-bug-fix -> master
# After merge to master, create PR: hotfix/critical-bug-fix -> develop
```

## Branch Naming Conventions

### Features
- Format: `feature/short-description`
- Examples:
  - `feature/user-authentication`
  - `feature/payment-integration`
  - `feature/dark-mode`

### Releases
- Format: `release/vX.Y.Z`
- Examples:
  - `release/v1.0.0`
  - `release/v2.1.0`

### Hotfixes
- Format: `hotfix/short-description`
- Examples:
  - `hotfix/security-patch`
  - `hotfix/payment-bug`
  - `hotfix/login-error`

## Commit Message Format

Follow Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

### Examples
```bash
feat(auth): add OAuth2 integration
fix(player): resolve playback issue on mobile
docs(api): update endpoint documentation
chore(deps): update dependencies
```

## Protected Branch Rules

### Master Branch
- ✅ Requires pull request reviews (1 approval minimum)
- ✅ Dismiss stale pull request approvals
- ✅ No direct pushes allowed
- ✅ No force pushes allowed
- ✅ No deletions allowed
- ✅ Only accepts merges from `release/*` and `hotfix/*`

### Develop Branch
- ✅ Requires pull request reviews (1 approval minimum)
- ✅ Dismiss stale pull request approvals
- ✅ No direct pushes allowed
- ✅ No force pushes allowed
- ✅ No deletions allowed
- ✅ Accepts merges from `feature/*`, `release/*`, and `hotfix/*`

## Pull Request Process

1. **Create PR** with descriptive title following commit conventions
2. **Fill PR template** completely
3. **Ensure CI passes** - all checks must be green
4. **Request review** from at least one team member
5. **Address feedback** and get approval
6. **Merge** using the appropriate strategy:
   - Features to develop: Squash and merge
   - Releases/Hotfixes to master: Merge commit
   - Back-merges to develop: Merge commit

## Version Management

- Version format: `vMAJOR.MINOR.PATCH`
- Update version in `package.json` during release
- Tag releases on master: `git tag -a v1.0.0 -m "Release v1.0.0"`
- Maintain CHANGELOG.md with all changes

## Quick Reference

```bash
# Start feature
git flow feature start my-feature

# Finish feature
git flow feature finish my-feature

# Start release
git flow release start v1.0.0

# Finish release
git flow release finish v1.0.0

# Start hotfix
git flow hotfix start critical-fix

# Finish hotfix
git flow hotfix finish critical-fix
```

Note: Install git-flow extensions for easier workflow management:
- macOS: `brew install git-flow`
- Ubuntu: `apt-get install git-flow`
- Windows: Install via Git for Windows

## Enforcement

These rules are enforced through:
1. Branch protection rules on GitHub
2. CI/CD pipeline checks
3. Automated PR validation
4. Required status checks

Non-compliance will result in blocked PRs and failed deployments.