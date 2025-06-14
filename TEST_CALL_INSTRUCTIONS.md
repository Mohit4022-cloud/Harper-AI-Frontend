# Test Call Instructions

## Your Test Configuration
- **Test Phone**: +1 (970) 567-7890
- **Twilio Caller**: +1 (442) 266-3218

## Quick Test (Local Development)

```bash
# 1. Make sure your server is running
npm run dev

# 2. Run the quick test script
node scripts/quick-call-test.js

# 3. Answer the phone when it rings!
```

## What You Should Hear

1. **First**: "Connecting you to the AI assistant"
2. **Then**: 
   - If ElevenLabs is configured: AI voice message
   - If not configured: Fallback message about configuration

## Manual Test via cURL

```bash
# Test locally
curl -X POST http://localhost:3000/api/call/start \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19705677890",
    "settings": {
      "integrations": {
        "twilioCallerNumber": "+14422663218"
      }
    }
  }'

# Test on Render
curl -X POST https://harper-ai-frontend-2.onrender.com/api/call/start \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19705677890",
    "settings": {
      "integrations": {
        "twilioCallerNumber": "+14422663218"
      }
    }
  }'
```

## Debugging

### Check Logs
Look for these key log entries:
1. `call.start.request` - Call initiated
2. `twilio.voice.webhook` - Twilio connected
3. `elevenlabs.test_audio.request` - Audio generation attempted

### Common Issues

1. **"accountSid must start with AC"**
   - Your Twilio credentials aren't set properly
   - Check .env.local or Render environment variables

2. **No call received**
   - Verify phone number format (+1 prefix for US)
   - Check Twilio account balance
   - Verify Twilio phone number is active

3. **Call disconnects immediately**
   - This is expected without WebSocket support
   - The audio fallback plays then hangs up

## Test Audio Pipeline Only

```bash
# Test ElevenLabs audio generation
curl http://localhost:3000/api/elevenlabs/test-audio?reqId=test123 \
  --output test-audio.mp3

# Play the audio
open test-audio.mp3  # macOS
# or
# mpg123 test-audio.mp3  # Linux
```

## Environment Variables Check

Make sure these are set in .env.local:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_CALLER_NUMBER=+14422663218
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxxxx
```