# Call Lifecycle Debug Guide

## Current Issue
The voice call connects and plays "Connecting you to the AI assistant..." but disconnects shortly afterward with no AI response.

## Architecture Overview

### Call Flow
1. Client calls `/api/call/start` with phone number
2. API initializes relay config and calls Twilio to create outbound call
3. Twilio webhook hits `/api/twilio/voice?reqId={reqId}` 
4. Voice endpoint returns TwiML with `<Stream>` or `<Play>` directive
5. For streaming: WebSocket connection established to relay media
6. For audio: ElevenLabs TTS generates audio file
7. Transcript updated in real-time via `/api/call/transcript`

## Debug Checkpoints

### 1. Configuration Validation
```bash
# Run configuration test
node scripts/test-twilio-config.js

# Required environment variables
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_CALLER_NUMBER=+1234567890
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxxxx
BASE_URL=https://your-domain.com  # For webhooks
```

### 2. Call Lifecycle Test
```bash
# Run comprehensive test (replace with your phone number)
TEST_PHONE_NUMBER=+1234567890 node scripts/test-call-lifecycle.js
```

### 3. Log Checkpoints

#### Success Flow
```
call.start.request
relay.init.success (if first call)
call.start.context_added
call.start.success
twilio.voice.webhook
twilio.voice.twiml.generating
elevenlabs.test_audio.request (or elevenlabs.stream.started)
elevenlabs.audio.chunk.received
twilio.stream.attached
transcript.user / transcript.agent
twilio.status.update (completed)
```

#### Common Failures
```
elevenlabs.signed_url.error - Invalid agent ID or API key
elevenlabs.connect.failed - WebSocket connection issue
twilio.voice.missing_reqId - Request ID not passed correctly
transcript.empty_timeout - No conversation happening
```

## Current Implementation Status

### Working ✅
- Twilio call initiation
- Basic TwiML generation
- Call status tracking
- Configuration management

### Issues ❌
- WebSocket streaming not supported in Next.js App Router
- Need separate WebSocket server for real-time audio
- ElevenLabs agent vs voice ID confusion

## Solutions

### 1. Local Development (Full Streaming)
```bash
# Enable relay subprocess
echo "USE_RELAY_SUBPROCESS=true" >> .env.local
echo "RELAY_PORT=8000" >> .env.local

# Start the app
npm run dev

# The relay subprocess will handle WebSocket streaming
```

### 2. Production/Render (Audio Playback)
The current implementation uses a fallback approach:
- Generates audio using ElevenLabs TTS
- Plays audio file via Twilio `<Play>` directive
- No real-time conversation (one-way audio only)

### 3. Full Production Solution
For real-time bidirectional conversation:
1. Deploy separate WebSocket server (e.g., on Railway, Fly.io)
2. Update TwiML to point to WebSocket server
3. Or use a service like Twilio Media Streams with a proxy

## Testing Audio Pipeline

### 1. Test ElevenLabs TTS
```bash
# Direct API test
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hi, this is your AI agent. How can I help?",
    "model_id": "eleven_monolingual_v1"
  }' \
  --output test.mp3
```

### 2. Test Audio Endpoint
```bash
curl "http://localhost:3000/api/elevenlabs/test-audio?reqId=test123"
```

### 3. Mock AI Response
In `/api/elevenlabs/test-audio/route.ts`, the test message can be customized:
```typescript
const testMessage = "Hi, this is your AI agent. How can I help you today?";
```

## Troubleshooting

### "Disconnects after system message"
1. Check logs for `twilio.voice.twiml.generated`
2. Verify TwiML is valid XML
3. Check if audio URL is accessible
4. Look for ElevenLabs API errors

### "No transcript generated"
1. WebSocket streaming required for real-time transcript
2. Current fallback doesn't capture user speech
3. Need bidirectional audio stream

### "Invalid agent ID"
1. ElevenLabs Conversational AI requires specific agent setup
2. Voice ID != Agent ID
3. Check ElevenLabs dashboard for correct IDs

## Next Steps

1. **For Testing**: Use the test scripts to validate configuration
2. **For Development**: Enable relay subprocess for full streaming
3. **For Production**: Deploy separate WebSocket server or use audio fallback
4. **For Debugging**: Check logs at each checkpoint

## Important Notes

- The `callSid` is created by Twilio, not our system
- The `reqId` links the call context between services
- Transcripts are only available with WebSocket streaming
- Audio playback is one-way (no user input captured)