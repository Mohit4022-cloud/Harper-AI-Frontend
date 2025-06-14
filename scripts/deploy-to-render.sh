#!/bin/bash

# Render Deploy Script
# This script triggers a manual deployment to Render using the deploy hook

echo "🚀 Triggering Render deployment..."

# Replace this with your actual Render deploy hook URL
# You can find it in Render Dashboard → Settings → Deploy Hook
DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-YOUR-SERVICE-ID?key=YOUR-DEPLOY-KEY"

# Trigger the deployment
curl -X POST "$DEPLOY_HOOK_URL"

echo "✅ Deployment triggered!"
echo "📊 Check deployment status at: https://dashboard.render.com/"