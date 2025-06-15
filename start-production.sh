#!/bin/bash

# Production startup script for Harper AI
# Starts both the Next.js app and the relay service

echo "🚀 Starting Harper AI in production mode..."

# Load environment variables
if [ -f .env.local ]; then
  echo "📋 Loading environment variables from .env.local"
  set -a
  source .env.local
  set +a
fi

# Check if relay port is set
RELAY_PORT=${RELAY_PORT:-8000}
echo "🔌 Relay will run on port $RELAY_PORT"

# Start the relay service in background
echo "🔄 Starting relay service..."
cd src/lib/productiv-ai-relay && npm start &
RELAY_PID=$!
echo "✅ Relay service started with PID $RELAY_PID"

# Wait for relay to be ready
echo "⏳ Waiting for relay service to be ready..."
sleep 3

# Check if relay is healthy
curl -s http://localhost:$RELAY_PORT/health > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Relay service is healthy"
else
  echo "⚠️  Relay service health check failed, but continuing..."
fi

# Start Next.js production server
echo "🌐 Starting Next.js production server..."
cd ../../.. && npm start

# Cleanup on exit
trap "echo '🛑 Shutting down...'; kill $RELAY_PID 2>/dev/null" EXIT