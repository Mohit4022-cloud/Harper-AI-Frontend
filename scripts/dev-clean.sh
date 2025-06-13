#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-3000}

echo "🔪  Killing anything already on $PORT..."
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null || true

echo "🧹  Purging .next cache..."
rm -rf .next

echo "📦  Ensuring deps are healthy..."
npm install --silent

echo "🚀  Booting Next.js on $PORT with DEBUG"
DEBUG="next:*" exec npm run dev -- -p $PORT