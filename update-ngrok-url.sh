#!/bin/bash

# Script to update BASE_URL with ngrok URL

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide your ngrok URL"
    echo "Usage: ./update-ngrok-url.sh https://your-id.ngrok-free.app"
    exit 1
fi

NGROK_URL=$1

# Validate URL format
if [[ ! "$NGROK_URL" =~ ^https://.*\.ngrok.*\.(io|app)$ ]]; then
    echo "❌ Error: Invalid ngrok URL format"
    echo "Expected format: https://your-id.ngrok-free.app"
    exit 1
fi

echo "🔄 Updating .env.local with ngrok URL: $NGROK_URL"

# Update BASE_URL in .env.local
sed -i.bak "s|BASE_URL=.*|BASE_URL=$NGROK_URL|" .env.local

# Also update NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_API_URL for consistency
sed -i.bak "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=$NGROK_URL|" .env.local
sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$NGROK_URL|" .env.local

echo "✅ Updated .env.local successfully!"
echo ""
echo "📋 Current configuration:"
grep -E "(BASE_URL|NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_API_URL)=" .env.local | grep -v "^#"
echo ""
echo "🚀 Now restart your server with: ./start-with-env.sh"