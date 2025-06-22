#!/bin/bash

# Deployment Checklist Script
# Run this before deploying to ensure everything is ready

echo "🚀 Harper AI Frontend - Deployment Readiness Checklist"
echo "===================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track failures
FAILURES=0

# Function to check a condition
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        FAILURES=$((FAILURES + 1))
    fi
}

echo -e "\n${YELLOW}1. Checking Build...${NC}"
npm run build > /dev/null 2>&1
check $? "Build completes successfully"

echo -e "\n${YELLOW}2. Checking TypeScript...${NC}"
npm run type-check > /dev/null 2>&1
check $? "TypeScript compilation passes"

echo -e "\n${YELLOW}3. Checking Environment Files...${NC}"
[ -f ".env.example" ]
check $? ".env.example exists"

echo -e "\n${YELLOW}4. Checking Dependencies...${NC}"
npm audit --production --audit-level=high > /dev/null 2>&1
check $? "No high severity vulnerabilities"

echo -e "\n${YELLOW}5. Checking Configuration Files...${NC}"
[ -f "render.yaml" ]
check $? "render.yaml exists"
[ -f "next.config.ts" ]
check $? "next.config.ts exists"
[ -f "tsconfig.json" ]
check $? "tsconfig.json exists"

echo -e "\n${YELLOW}6. Checking Critical Directories...${NC}"
[ -d "src" ]
check $? "src directory exists"
[ -d "public" ]
check $? "public directory exists"
[ -d "prisma" ]
check $? "prisma directory exists"

echo -e "\n${YELLOW}7. Checking Database...${NC}"
[ -f "prisma/schema.prisma" ]
check $? "Prisma schema exists"

echo -e "\n${YELLOW}8. Checking Git Status...${NC}"
UNCOMMITTED=$(git status --porcelain | wc -l)
[ $UNCOMMITTED -eq 0 ]
check $? "No uncommitted changes"

echo -e "\n${YELLOW}9. Checking Branch...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

echo -e "\n${YELLOW}10. Environment Variables Required:${NC}"
echo "Make sure these are set in Render:"
echo "  - NODE_ENV"
echo "  - DATABASE_URL"
echo "  - JWT_SECRET"
echo "  - TWILIO_ACCOUNT_SID"
echo "  - TWILIO_AUTH_TOKEN"
echo "  - TWILIO_CALLER_NUMBER"
echo "  - ELEVENLABS_API_KEY"
echo "  - GEMINI_API_KEY"

echo -e "\n${YELLOW}Summary:${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURES checks failed. Please fix before deploying.${NC}"
    exit 1
fi