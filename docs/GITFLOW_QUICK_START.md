# GitFlow Quick Start Guide

## 🚀 Getting Started

### Install GitFlow (Optional)
```bash
# macOS
brew install git-flow

# Ubuntu/Debian
apt-get install git-flow

# Windows
# Install via Git for Windows
```

### Use Our Helper Script
```bash
./scripts/gitflow-helper.sh
```

## 📋 Common Workflows

### Starting a New Feature
```bash
# Option 1: Using helper script
./scripts/gitflow-helper.sh
# Select option 1

# Option 2: Manual
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Option 3: Using git-flow
git flow feature start my-feature
```

### Creating a Release
```bash
# Option 1: Using helper script
./scripts/gitflow-helper.sh
# Select option 3

# Option 2: Manual
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
npm version 1.0.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to 1.0.0"

# Option 3: Using git-flow
git flow release start v1.0.0
```

### Emergency Hotfix
```bash
# Option 1: Using helper script
./scripts/gitflow-helper.sh
# Select option 5

# Option 2: Manual
git checkout master
git pull origin master
git checkout -b hotfix/critical-bug

# Option 3: Using git-flow
git flow hotfix start critical-bug
```

## 🔄 PR Flow

### Feature → Develop
1. Push feature branch
2. Create PR to `develop`
3. Get approval
4. Merge (squash recommended)
5. Delete feature branch

### Release → Master → Develop
1. Push release branch
2. Create PR to `master`
3. Get approval and merge
4. Tag on master: `git tag -a v1.0.0 -m "Release v1.0.0"`
5. Create PR from release to `develop` (back-merge)
6. Merge and delete release branch

### Hotfix → Master → Develop
1. Push hotfix branch
2. Create PR to `master`
3. Get approval and merge (fast!)
4. Create PR from hotfix to `develop` (back-merge)
5. Merge and delete hotfix branch

## ⚡ Quick Commands

```bash
# Check current branch
git branch --show-current

# List all feature branches
git branch -r | grep feature/

# Clean up merged branches
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# Sync with upstream
git fetch --all --prune
```

## 🚫 Common Mistakes to Avoid

1. **Never commit directly to master or develop**
2. **Don't merge features to master** (only to develop)
3. **Don't forget back-merges** after release/hotfix
4. **Don't reuse branch names** - delete after merge
5. **Don't skip PR reviews** - even for hotfixes

## 📱 VS Code Extension

Install "GitFlow" extension for visual workflow:
```
ext install vector-of-bool.gitflow
```

## 🆘 Need Help?

1. Check full documentation: [GITFLOW.md](./GITFLOW.md)
2. Run: `./scripts/gitflow-helper.sh`
3. Ask in team chat
4. Review PR templates in `.github/PULL_REQUEST_TEMPLATE/`