#!/bin/bash

# Script to switch from mock to real authentication
# This updates the auth routes to use the real implementation

set -e

echo "🔄 Switching to Real Authentication"
echo "==================================="

# Check if real auth files exist
if [ ! -f "src/app/api/auth/login/route.real.ts" ]; then
    echo "❌ Error: Real auth files not found"
    echo "Please ensure route.real.ts files exist"
    exit 1
fi

# Backup current mock routes
echo "📦 Backing up current mock routes..."
cp src/app/api/auth/login/route.ts src/app/api/auth/login/route.mock.ts 2>/dev/null || true
cp src/app/api/auth/register/route.ts src/app/api/auth/register/route.mock.ts 2>/dev/null || true

# Switch to real routes
echo "🔄 Switching to real authentication routes..."
cp src/app/api/auth/login/route.real.ts src/app/api/auth/login/route.ts
cp src/app/api/auth/register/route.real.ts src/app/api/auth/register/route.ts

echo "✅ Switched to real authentication!"
echo ""
echo "Next steps:"
echo "1. Ensure DATABASE_URL is set in .env"
echo "2. Run './scripts/setup-database.sh' to set up the database"
echo "3. Restart your development server"
echo ""
echo "To switch back to mock auth, run:"
echo "cp src/app/api/auth/login/route.mock.ts src/app/api/auth/login/route.ts"
echo "cp src/app/api/auth/register/route.mock.ts src/app/api/auth/register/route.ts"