# Twilio + ElevenLabs Integration Setup

This guide explains how to test live outbound calls from Harper AI using Twilio and ElevenLabs.

## Prerequisites

1. **Twilio Account**
   - Sign up at https://www.twilio.com
   - Get your Account SID and Auth Token from the Twilio Console
   - Purchase a phone number with voice capabilities

2. **ElevenLabs Account** (Optional)
   - Sign up at https://elevenlabs.io
   - Get your API key from the profile settings
   - Note your preferred Voice ID

## Environment Setup

Add these variables to your `.env.local` file:

```bash
# Required Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CALLER_NUMBER=+14445551234  # Your Twilio phone number
BASE_URL=https://harper-ai-frontend.onrender.com  # Your deployment URL

# Optional ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel voice
ELEVENLABS_AUDIO_URL=https://yourdomain.com/greeting.mp3  # Pre-generated audio
```

## Testing the Integration

### 1. Using the Test Call Feature

1. Navigate to `/calling` in your Harper AI app
2. Look for the "Test Twilio + ElevenLabs Integration" section
3. Click "Test Call"
4. Enter your phone number (US numbers only)
5. Click "Make Test Call"

You should receive a call within seconds!

### 2. What Happens During the Call

The call flow:
1. Twilio calls your number from `TWILIO_CALLER_NUMBER`
2. When you answer, it plays:
   - ElevenLabs audio (if `ELEVENLABS_AUDIO_URL` is set)
   - OR Twilio Polly voice as fallback
3. You can press:
   - `1` to replay the message
   - `2` to end the call

### 3. Creating ElevenLabs Audio

To generate an MP3 with ElevenLabs:

```bash
# Using curl
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! This is Harper AI calling. We are testing our new outbound calling system powered by Twilio and Eleven Labs. How exciting is that? Have a wonderful day!",
    "model_id": "eleven_monolingual_v1",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.5
    }
  }' \
  --output harper-greeting.mp3
```

### 4. Hosting the Audio File

Options for hosting your ElevenLabs MP3:

1. **Render Static Files**
   - Place in `public/audio/greeting.mp3`
   - Set `ELEVENLABS_AUDIO_URL=https://harper-ai-frontend.onrender.com/audio/greeting.mp3`

2. **AWS S3**
   - Upload to S3 bucket
   - Make publicly accessible
   - Use the S3 URL

3. **Cloudinary/CDN**
   - Upload to any CDN
   - Use the public URL

## API Endpoints

### POST /api/call/start
Initiates an outbound call.

**Request:**
```json
{
  "phone": "+14155551234"
}
```

**Response:**
```json
{
  "success": true,
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "from": "+14445551234",
  "to": "+14155551234"
}
```

### GET /api/call/voice
Twilio webhook that returns TwiML for the call.

### POST /api/call/status
Receives call status updates from Twilio.

### POST /api/tts
Generate speech with ElevenLabs (optional).

**Request:**
```json
{
  "text": "Hello from Harper AI",
  "voiceSettings": {
    "stability": 0.5,
    "similarity_boost": 0.5
  }
}
```

## Troubleshooting

### Call Not Connecting
- Verify Twilio credentials in `.env`
- Check Twilio phone number is active
- Ensure BASE_URL is publicly accessible
- Check Twilio console for error logs

### No Audio Playing
- Verify ELEVENLABS_AUDIO_URL is accessible
- Test URL in browser
- Check Twilio webhook logs
- Fallback to Polly voice works?

### Webhook Errors
- Ensure `/api/call/voice` is accessible
- Check for CORS issues
- Verify BASE_URL matches deployment
- Test with ngrok for local development

## Security Considerations

1. **Webhook Validation**
   - Consider implementing Twilio webhook signature validation
   - Use TWILIO_WEBHOOK_SECRET in production

2. **Rate Limiting**
   - Implement rate limiting on `/api/call/start`
   - Track usage per user/IP

3. **Phone Number Validation**
   - Validate E.164 format
   - Consider geographic restrictions
   - Implement blocklist for abuse prevention

## Next Steps

1. **Production Setup**
   - Enable webhook signature validation
   - Implement proper error handling
   - Add call analytics tracking
   - Set up monitoring/alerts

2. **Advanced Features**
   - Real-time transcription with AssemblyAI
   - Dynamic TTS based on contact data
   - Call recording and storage
   - WebSocket updates to frontend

3. **Cost Optimization**
   - Cache ElevenLabs audio
   - Use Twilio Polly for non-critical calls
   - Implement usage quotas