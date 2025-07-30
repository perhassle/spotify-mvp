#!/bin/bash

# Fix common ESLint issues

# 1. Fix unused authConfig imports in API routes
echo "Fixing unused authConfig imports..."
find src/app/api -name "*.ts" -type f | while read file; do
  if grep -q "import { authConfig }" "$file" && ! grep -q "authConfig[^']" "$file"; then
    echo "Removing unused authConfig from $file"
    sed -i.bak "/import { authConfig }/d" "$file"
    rm "$file.bak"
  fi
done

# 2. Fix unused request parameters - rename to _request
echo "Fixing unused request parameters..."
find src/app/api -name "*.ts" -type f | while read file; do
  if grep -q "request: Request" "$file"; then
    echo "Checking $file for unused request parameter"
    # Check if 'request' is used in the file (excluding the parameter declaration)
    if ! grep -q "request\." "$file" && ! grep -q "request)" "$file" && ! grep -q "request," "$file"; then
      echo "Renaming unused request to _request in $file"
      sed -i.bak "s/request: Request/_request: Request/g" "$file"
      rm "$file.bak"
    fi
  fi
done

# 3. Fix any type annotations
echo "Fixing 'any' type annotations..."
# This is more complex and needs manual review, so we'll just report them
echo "Files with 'any' type annotations that need manual review:"
grep -r ": any" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | cut -d: -f1 | sort | uniq

echo "Done!"