#!/bin/bash

# Render.com startup script
# Starts the relay service and Next.js app for production

echo "🚀 Starting Harper AI on Render..."

# Install relay dependencies if needed
if [ ! -d "src/lib/productiv-ai-relay/node_modules" ]; then
  echo "📦 Installing relay dependencies..."
  cd src/lib/productiv-ai-relay && npm ci && cd ../../..
fi

# Start relay service in background
echo "🔄 Starting relay service on port 8000..."
cd src/lib/productiv-ai-relay && PORT=8000 npm start &
RELAY_PID=$!

# Wait for relay to initialize
echo "⏳ Waiting for relay service..."
sleep 5

# Check relay health
for i in {1..10}; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Relay service is ready"
    break
  fi
  echo "⏳ Waiting for relay... attempt $i/10"
  sleep 2
done

# Start Next.js
echo "🌐 Starting Next.js server..."
cd ../../.. && npm start

# Keep the script running
wait