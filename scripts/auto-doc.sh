#!/bin/bash
# VelvetLadle Auto-Documentation Script
# Usage: ./scripts/auto-doc.sh "feat(favorites): add recipe favorites system"

COMMIT_MSG="$1"
DATE=$(date +%Y-%m-%d)
HASH=$(git rev-parse --short HEAD)

# Parse commit type
TYPE=$(echo "$COMMIT_MSG" | grep -o '^[a-z]*')
SCOPE=$(echo "$COMMIT_MSG" | grep -o '([^)]*)')
DESC=$(echo "$COMMIT_MSG" | sed 's/^[a-z]*[^:]*: //')

echo "🚀 Auto-documenting change..."
echo "Type: $TYPE, Scope: $SCOPE, Description: $DESC"

# Update CHANGELOG.md
if [ "$TYPE" = "feat" ]; then
    # Add to features section
    sed -i "7i\\- ✨ **$DESC** ($DATE)" CHANGELOG.md
elif [ "$TYPE" = "fix" ]; then
    # Add to bug fixes section  
    sed -i "7i\\- 🐛 **$DESC** ($DATE)" CHANGELOG.md
elif [ "$TYPE" = "perf" ]; then
    # Add to performance section
    sed -i "7i\\- ⚡ **$DESC** ($DATE)" CHANGELOG.md
fi

# Update README.md recent enhancements
if [ "$TYPE" = "feat" ]; then
    sed -i "s/## ✨ \*\*Recent Enhancements.*/&\\n- **📱 $DESC**: Latest feature addition/" README.md
fi

# Add to testing checklist if it's a feature
if [ "$TYPE" = "feat" ]; then
    echo "- [ ] **$DESC**: Test the new functionality works correctly" >> TESTING_CHECKLIST.md
fi

echo "✅ Documentation updated automatically!"
