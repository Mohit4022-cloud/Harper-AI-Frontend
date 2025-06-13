#!/bin/bash

echo "🚀 Starting Harper AI Development Server..."
echo "=================================="

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Killing existing process..."
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
fi

# Start the development server
echo "📦 Starting Next.js development server..."
npm run dev &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test if server is responding
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:3000"
    echo "🎯 Try logging in with:"
    echo "   Email: demo@harperai.com"
    echo "   Password: any password (6+ chars)"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    # Keep script running to maintain server
    wait
else
    echo "❌ Server failed to start"
    exit 1
fi