#!/bin/bash

echo "🚀 Starting Harper AI with Environment Variables..."
echo "=================================="

# Load environment variables from .env.local
set -a
source .env.local
set +a

echo "📋 Environment loaded:"
echo "   BASE_URL: $BASE_URL"
echo "   NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
echo "   RELAY_ENABLED: $RELAY_ENABLED"

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Killing existing process..."
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
fi

# Start the relay service if enabled
if [ "$RELAY_ENABLED" = "true" ]; then
    echo "🔌 Starting WebSocket relay service..."
    node scripts/start-relay.js &
    RELAY_PID=$!
    echo "   Relay started with PID: $RELAY_PID"
fi

# Start the development server
echo "📦 Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test if server is responding
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:3000"
    echo ""
    echo "🌐 To expose with ngrok, run in another terminal:"
    echo "   ngrok http 3000"
    echo ""
    echo "📝 Then update BASE_URL in .env.local with the ngrok URL"
    echo ""
    echo "🎯 Try logging in with:"
    echo "   Email: demo@harperai.com"
    echo "   Password: any password (6+ chars)"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    # Trap Ctrl+C to clean up processes
    trap "echo '🛑 Stopping servers...'; kill $NEXT_PID $RELAY_PID 2>/dev/null; exit" INT
    
    # Keep script running to maintain server
    wait
else
    echo "❌ Server failed to start"
    kill $RELAY_PID 2>/dev/null
    exit 1
fi