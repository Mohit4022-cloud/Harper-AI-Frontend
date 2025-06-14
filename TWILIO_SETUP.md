# Twilio Voice Setup Guide

This guide will help you set up Twilio Voice for the Harper AI platform.

## Prerequisites

- Twilio account (sign up at https://www.twilio.com)
- Verified phone number in Twilio
- Node.js environment

## Step 1: Get Twilio Credentials

1. Log in to your Twilio Console
2. Navigate to **Account** → **API keys & tokens**
3. Note down your:
   - Account SID (starts with `AC`)
   - Auth Token

## Step 2: Create API Key

1. In Twilio Console, go to **Account** → **API keys & tokens**
2. Click **Create API Key**
3. Give it a friendly name (e.g., "Harper AI Voice")
4. Save the:
   - API Key SID (starts with `SK`)
   - API Key Secret (shown only once!)

## Step 3: Create TwiML App

1. Navigate to **Voice** → **TwiML Apps**
2. Click **Create new TwiML App**
3. Configure:
   - **Friendly Name**: Harper AI Voice App
   - **Voice URL**: `https://your-domain.com/api/twilio/voice`
   - **Voice Method**: POST
   - **Status Callback URL**: `https://your-domain.com/api/twilio/status`
4. Save the TwiML App SID (starts with `AP`)

## Step 4: Get a Phone Number

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number with Voice capabilities
3. Configure the number:
   - **Voice & Fax** → **Configure With**: TwiML App
   - **TwiML App**: Select your Harper AI Voice App

## Step 5: Configure Environment Variables

Create or update your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_CALLER_NUMBER=+1234567890

# Enable Twilio
ENABLE_TWILIO_CALLING=true
```

## Step 6: Configure Webhooks

Update your TwiML App webhooks to point to your deployment:

### Development (using ngrok)
```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL for webhooks, e.g.:
# https://abc123.ngrok.io/api/twilio/voice
```

### Production
Use your actual domain:
- Voice URL: `https://harper-ai-frontend-1.onrender.com/api/twilio/voice`
- Status Callback: `https://harper-ai-frontend-1.onrender.com/api/twilio/status`

## Step 7: Test Your Setup

1. Navigate to the Calling page in Harper AI
2. Enter a phone number to call
3. Click the call button
4. You should hear: "Hello, this is Harper AI connecting your call"

## Webhook Endpoints

Harper AI provides the following Twilio webhook endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/twilio/voice` | POST | TwiML generation for calls |
| `/api/twilio/status` | POST | Call status updates |
| `/api/twilio/recording` | POST | Recording completion notifications |
| `/api/twilio/transcription` | POST | Transcription results |

## Development Mode

In development mode (when `NODE_ENV=development` and no Twilio credentials):
- The system uses mock credentials
- Calls won't actually connect
- Perfect for UI development and testing

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Validate webhooks** - Verify requests are from Twilio
3. **Use HTTPS** - Always use secure connections
4. **Rotate credentials** - Regularly update API keys
5. **Limit permissions** - Use minimal required permissions

## Troubleshooting

### "Twilio Device not initialized"
- Check that all environment variables are set
- Verify API credentials are correct
- Check browser console for errors

### "Invalid or expired token"
- Tokens expire after 1 hour
- Refresh the page to get a new token
- Check JWT_SECRET is configured

### Calls not connecting
- Verify phone number format (+1234567890)
- Check TwiML App configuration
- Ensure webhooks are accessible
- Check Twilio account balance

### No audio
- Check browser microphone permissions
- Verify codec preferences (opus, pcmu)
- Test with different browsers

## Cost Considerations

Twilio charges for:
- Phone numbers (~$1/month)
- Outbound calls (~$0.013/minute)
- Recording storage (~$0.0025/minute)
- Transcription (~$0.05/minute)

Monitor usage in Twilio Console → **Monitor** → **Usage**

## Next Steps

1. Set up call recording storage (AWS S3 recommended)
2. Implement real-time transcription
3. Add call analytics and reporting
4. Configure international calling
5. Set up SMS capabilities

For more information, see the [Twilio Voice documentation](https://www.twilio.com/docs/voice).