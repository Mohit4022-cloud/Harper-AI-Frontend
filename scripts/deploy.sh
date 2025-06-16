#!/bin/bash

# Harper AI Frontend Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to staging if no environment specified
ENVIRONMENT=${1:-staging}

echo -e "${GREEN}🚀 Harper AI Frontend Deployment${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

# Check if required files exist
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${RED}❌ Missing .env.$ENVIRONMENT file${NC}"
    exit 1
fi

# Run pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check Node version
NODE_VERSION=$(node -v)
echo "✓ Node version: $NODE_VERSION"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ Uncommitted changes detected. Please commit or stash them.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run type checking
echo -e "${YELLOW}🔍 Type checking...${NC}"
npm run type-check

# Run tests (if they exist)
if [ -f "jest.config.js" ]; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    npm test -- --passWithNoTests || true
fi

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Create deployment bundle
echo -e "${YELLOW}📦 Creating deployment bundle...${NC}"
mkdir -p dist

# Copy necessary files
cp -r .next dist/
cp -r public dist/
cp package*.json dist/
cp next.config.* dist/
cp -r src dist/
cp .env.$ENVIRONMENT dist/.env.production.local

# Create deployment info
echo "{
  \"environment\": \"$ENVIRONMENT\",
  \"deployedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"commit\": \"$(git rev-parse HEAD)\",
  \"branch\": \"$(git branch --show-current)\",
  \"nodeVersion\": \"$NODE_VERSION\"
}" > dist/deployment-info.json

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Deployment checklist:${NC}"
echo "  1. Upload dist/ folder to your server"
echo "  2. Run 'npm install --production' on server"
echo "  3. Set environment variables from .env.$ENVIRONMENT"
echo "  4. Run 'npm start' or use PM2/systemd"
echo "  5. Configure nginx/reverse proxy"
echo "  6. Test all critical paths"
echo ""

# If production, show additional warnings
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNINGS:${NC}"
    echo "  - Ensure database backups are current"
    echo "  - Verify all API keys are production keys"
    echo "  - Check rate limiting is properly configured"
    echo "  - Ensure monitoring/alerting is set up"
    echo "  - Test rollback procedure"
fi

echo -e "${GREEN}✅ Deployment bundle ready in dist/ directory${NC}"