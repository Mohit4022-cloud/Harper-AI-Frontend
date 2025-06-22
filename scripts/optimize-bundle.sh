#!/bin/bash

# Bundle Optimization Script for Harper AI Frontend
# This script analyzes and provides recommendations for bundle optimization

echo "🚀 Harper AI Frontend Bundle Optimization"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Clean previous builds
echo -e "\n${YELLOW}1. Cleaning previous builds...${NC}"
rm -rf .next

# Run bundle analyzer
echo -e "\n${YELLOW}2. Running bundle analyzer...${NC}"
ANALYZE=true npm run build

# Check bundle sizes
echo -e "\n${YELLOW}3. Analyzing bundle sizes...${NC}"
if [ -d ".next" ]; then
    echo "Client-side bundles:"
    find .next/static/chunks -name "*.js" -exec du -h {} \; | sort -rh | head -10
    
    echo -e "\nTotal bundle size:"
    du -sh .next/static
fi

# Provide optimization recommendations
echo -e "\n${GREEN}4. Optimization Recommendations:${NC}"
echo "================================"

echo -e "\n${YELLOW}a) Large Dependencies to Consider:${NC}"
echo "   - Consider lazy loading heavy components"
echo "   - Use dynamic imports for:"
echo "     * Chart libraries (recharts, d3)"
echo "     * AI/ML libraries (@google/generative-ai, openai)"
echo "     * Media libraries (recordrtc, simple-peer)"

echo -e "\n${YELLOW}b) Code Splitting Opportunities:${NC}"
echo "   - Split routes with dynamic imports"
echo "   - Lazy load modals and dialogs"
echo "   - Split vendor chunks by frequency of use"

echo -e "\n${YELLOW}c) Image Optimization:${NC}"
echo "   - Use Next.js Image component for all images"
echo "   - Implement responsive images with srcSet"
echo "   - Consider using AVIF format for better compression"

echo -e "\n${YELLOW}d) Performance Quick Wins:${NC}"
echo "   - Enable SWC minification (already enabled)"
echo "   - Use Preact in production (saves ~30KB)"
echo "   - Remove unused CSS with PurgeCSS"
echo "   - Enable HTTP/2 push for critical resources"

# Check for unused dependencies
echo -e "\n${YELLOW}5. Checking for unused dependencies...${NC}"
npx depcheck --json | jq -r '.dependencies[]' 2>/dev/null || echo "Install jq for better output: brew install jq"

echo -e "\n${GREEN}✅ Bundle optimization analysis complete!${NC}"
echo "Check the bundle analyzer report in your browser for detailed visualization."