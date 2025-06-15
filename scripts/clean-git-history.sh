#!/bin/bash

# Clean Git History Script
# This script helps remove sensitive files from Git history
# WARNING: This will rewrite Git history - use with caution

set -e

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "git-filter-repo is not installed. Please install it first:"
    echo "  pip install git-filter-repo"
    exit 1
fi

# Create a backup branch before making changes
echo "Creating backup branch 'backup-before-cleanup'..."
git branch backup-before-cleanup

echo "Removing sensitive files from Git history..."

# Remove .env files
git filter-repo --path .env --invert-paths

# Remove other sensitive files
git filter-repo --path .env.development --invert-paths
git filter-repo --path .env.production --invert-paths
git filter-repo --path .env.local --invert-paths

echo "Force pushing changes to remote..."
git push origin --force --all

echo "Cleanup complete!"
echo "A backup branch 'backup-before-cleanup' has been created."
echo "If anything went wrong, you can reset using: git reset --hard backup-before-cleanup"
