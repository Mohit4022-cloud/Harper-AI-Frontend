#!/bin/bash

# Harper AI Health Check Script
# Usage: ./scripts/health-check.sh [url]

set -e

# Default URL
URL=${1:-"http://localhost:3000"}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🏥 Harper AI Health Check${NC}"
echo -e "Checking: $URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint" || echo "000")
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "✅ $description: ${GREEN}OK${NC} ($response)"
        return 0
    else
        echo -e "❌ $description: ${RED}FAILED${NC} (Expected: $expected_status, Got: $response)"
        return 1
    fi
}

# Check main endpoints
echo -e "${YELLOW}Checking endpoints...${NC}"
check_endpoint "/" "200" "Homepage"
check_endpoint "/api/health" "200" "API Health"
check_endpoint "/login" "200" "Login page"
check_endpoint "/dashboard" "200" "Dashboard"

# Check API endpoints
echo -e "\n${YELLOW}Checking API endpoints...${NC}"
check_endpoint "/api/contacts" "401" "Contacts API (auth required)"
check_endpoint "/api/auth/me" "401" "Auth API"

# Check static assets
echo -e "\n${YELLOW}Checking static assets...${NC}"
check_endpoint "/_next/static/chunks/main.js" "200" "Main JS bundle"

# Performance check
echo -e "\n${YELLOW}Performance check...${NC}"
start_time=$(date +%s.%N)
curl -s -o /dev/null "$URL"
end_time=$(date +%s.%N)
load_time=$(echo "$end_time - $start_time" | bc)
echo -e "Homepage load time: ${load_time}s"

# Check security headers
echo -e "\n${YELLOW}Security headers check...${NC}"
headers=$(curl -s -I "$URL")

check_header() {
    local header=$1
    if echo "$headers" | grep -qi "$header"; then
        echo -e "✅ $header present"
    else
        echo -e "⚠️  $header missing"
    fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"
check_header "Strict-Transport-Security"

echo -e "\n${GREEN}Health check complete!${NC}"