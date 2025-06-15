# WebSocket Streaming Instructions

## Current Status
✅ **Basic calling works** - You can make calls and hear the AI voice
❌ **Real-time conversation** - Requires WebSocket streaming setup

## To Enable Full Conversation (Local Development)

### Option 1: Manual Relay Start (Recommended)

1. **Terminal 1 - Start the relay server:**
```bash
node scripts/start-relay.js
```
You should see:
```
🚀 Starting WebSocket Relay Server...
📡 Relay server starting on port 8000...
🔗 WebSocket endpoint: ws://localhost:8000/media-stream
```

2. **Terminal 2 - Start Next.js:**
```bash
npm run dev
```

3. **Terminal 3 - Make a test call:**
```bash
node scripts/quick-call-test.js
```

### Option 2: Fix the Worker Thread Issue

The current issue is that the pino logger is trying to use worker threads which conflict with Next.js. To fix:

1. Install pino without worker threads:
```bash
npm install pino@8 --save
```

2. Update logger configuration to disable workers:
```javascript
// In src/lib/logger.ts
export const logger = pino({
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname'
    }
  } : undefined,
  // Disable worker threads
  worker: false
})
```

## What You'll Experience

### Without WebSocket (Current):
1. "Connecting you to the AI assistant"
2. One-way audio message
3. Call ends

### With WebSocket (After Setup):
1. "Connecting you to the AI assistant"
2. **Real-time conversation with the AI**
3. **You can speak and the AI responds**
4. **Live transcripts available**
5. Call continues until you hang up

## Verifying WebSocket is Working

When WebSocket streaming is active, you'll see in the logs:
```
twilio.voice.using_relay_subprocess
relay.start.request
elevenlabs.stream.started
elevenlabs.audio.chunk.received
transcript.user: "Hello"
transcript.agent: "Hi! How can I help you today?"
```

## Troubleshooting

### "Cannot find module worker.js"
This is the pino logger issue. Use Option 1 (manual relay start) or fix the logger configuration.

### "Port 8000 already in use"
```bash
lsof -ti:8000 | xargs kill -9
```

### "accountSid must start with AC"
Your credentials are correct, this error is from the subprocess having stale environment variables. Restart both servers.

## Production Deployment

For production, you'll need:
1. Deploy the relay to a separate service (Railway, Fly.io, etc.)
2. Update webhook URLs to point to the relay service
3. Configure CORS and security headers
4. Use wss:// instead of ws:// for secure WebSocket

## Test Configuration
- Phone: +1 (970) 567-7890
- Twilio: +1 (442) 266-3218
- Agent ID: agent_01jx1w1hf3e68v6n8510t90ww0