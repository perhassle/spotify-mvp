#!/bin/bash

# GitFlow Helper Script
# This script helps developers follow GitFlow conventions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to validate branch name
validate_branch_name() {
    branch=$1
    if [[ $branch =~ ^(master|develop|feature/.+|release/v[0-9]+\.[0-9]+\.[0-9]+|hotfix/.+)$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to get current branch
get_current_branch() {
    git branch --show-current
}

# Function to ensure clean working directory
ensure_clean() {
    if [[ -n $(git status -s) ]]; then
        print_color $RED "Error: Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi
}

# Main menu
show_menu() {
    echo ""
    print_color $BLUE "=== GitFlow Helper ==="
    echo "1. Start new feature"
    echo "2. Finish feature"
    echo "3. Start release"
    echo "4. Finish release"
    echo "5. Start hotfix"
    echo "6. Finish hotfix"
    echo "7. Show GitFlow status"
    echo "8. Exit"
    echo ""
    read -p "Select option: " choice
}

# Start feature
start_feature() {
    read -p "Enter feature name (will create feature/name): " name
    if [[ -z "$name" ]]; then
        print_color $RED "Feature name cannot be empty"
        return
    fi
    
    ensure_clean
    git checkout develop
    git pull origin develop
    git checkout -b "feature/$name"
    print_color $GREEN "Created feature branch: feature/$name"
    print_color $YELLOW "When ready, create PR: feature/$name → develop"
}

# Finish feature
finish_feature() {
    current=$(get_current_branch)
    if [[ ! $current =~ ^feature/ ]]; then
        print_color $RED "Not on a feature branch"
        return
    fi
    
    ensure_clean
    git push origin "$current"
    print_color $GREEN "Pushed $current to origin"
    print_color $YELLOW "Next steps:"
    echo "1. Create PR: $current → develop"
    echo "2. Get approval and merge"
    echo "3. Delete local branch: git branch -d $current"
}

# Start release
start_release() {
    read -p "Enter version (e.g., 1.0.0): " version
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_color $RED "Invalid version format. Use X.Y.Z"
        return
    fi
    
    ensure_clean
    git checkout develop
    git pull origin develop
    git checkout -b "release/v$version"
    
    # Update package.json version
    if [[ -f package.json ]]; then
        npm version "$version" --no-git-tag-version
        git add package.json package-lock.json
        git commit -m "chore: bump version to $version"
    fi
    
    print_color $GREEN "Created release branch: release/v$version"
    print_color $YELLOW "Next steps:"
    echo "1. Update CHANGELOG.md"
    echo "2. Fix any last-minute issues"
    echo "3. Create PR: release/v$version → master"
}

# Finish release
finish_release() {
    current=$(get_current_branch)
    if [[ ! $current =~ ^release/ ]]; then
        print_color $RED "Not on a release branch"
        return
    fi
    
    version=${current#release/v}
    ensure_clean
    git push origin "$current"
    
    print_color $GREEN "Pushed $current to origin"
    print_color $YELLOW "Next steps:"
    echo "1. Create PR: $current → master"
    echo "2. After merge, tag master: git tag -a v$version -m \"Release v$version\""
    echo "3. Create PR: $current → develop (back-merge)"
    echo "4. Deploy to production"
}

# Start hotfix
start_hotfix() {
    read -p "Enter hotfix name (will create hotfix/name): " name
    if [[ -z "$name" ]]; then
        print_color $RED "Hotfix name cannot be empty"
        return
    fi
    
    ensure_clean
    git checkout master
    git pull origin master
    git checkout -b "hotfix/$name"
    print_color $GREEN "Created hotfix branch: hotfix/$name"
    print_color $YELLOW "Fix the issue and create PR: hotfix/$name → master"
}

# Finish hotfix
finish_hotfix() {
    current=$(get_current_branch)
    if [[ ! $current =~ ^hotfix/ ]]; then
        print_color $RED "Not on a hotfix branch"
        return
    fi
    
    ensure_clean
    git push origin "$current"
    print_color $GREEN "Pushed $current to origin"
    print_color $YELLOW "Next steps:"
    echo "1. Create PR: $current → master"
    echo "2. After merge, create PR: $current → develop (back-merge)"
    echo "3. Deploy hotfix to production"
}

# Show GitFlow status
show_status() {
    print_color $BLUE "=== GitFlow Status ==="
    echo ""
    
    print_color $GREEN "Current branch:"
    echo "  $(get_current_branch)"
    echo ""
    
    print_color $GREEN "Feature branches:"
    git branch -r | grep "origin/feature/" | sed 's/origin\//  /' || echo "  None"
    echo ""
    
    print_color $GREEN "Release branches:"
    git branch -r | grep "origin/release/" | sed 's/origin\//  /' || echo "  None"
    echo ""
    
    print_color $GREEN "Hotfix branches:"
    git branch -r | grep "origin/hotfix/" | sed 's/origin\//  /' || echo "  None"
}

# Main loop
while true; do
    show_menu
    case $choice in
        1) start_feature ;;
        2) finish_feature ;;
        3) start_release ;;
        4) finish_release ;;
        5) start_hotfix ;;
        6) finish_hotfix ;;
        7) show_status ;;
        8) print_color $GREEN "Goodbye!"; exit 0 ;;
        *) print_color $RED "Invalid option" ;;
    esac
done