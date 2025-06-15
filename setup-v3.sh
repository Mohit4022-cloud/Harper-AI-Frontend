#!/bin/bash

# Phase 1: Foundation Setup Script for Harper AI Frontend V3

echo "🚀 Starting Harper AI Frontend V3 Setup..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

# Create new branch
echo "📌 Creating new branch: front-end-v3"
git checkout -b front-end-v3

# Install new dependencies
echo "📦 Installing new dependencies..."
npm install @tanstack/react-query@^5.17.0 \
    @tanstack/react-virtual@^3.0.1 \
    framer-motion@^10.16.16 \
    socket.io-client@^4.7.2 \
    web-vitals@^3.5.0 \
    @next/bundle-analyzer@^14.0.4

# Install dev dependencies
echo "🔧 Installing dev dependencies..."
npm install -D @playwright/test@^1.40.1 \
    @testing-library/react@^14.1.2 \
    @testing-library/jest-dom@^6.1.6 \
    @testing-library/user-event@^14.5.2 \
    @types/node@^20.10.6 \
    @types/react@^18.2.46 \
    @types/react-dom@^18.2.18

echo "✅ Phase 1 Setup Complete!"
echo "Next steps:"
echo "1. Update configuration files"
echo "2. Set up React Query provider"
echo "3. Configure Socket.io client"
echo "4. Update TypeScript configuration"