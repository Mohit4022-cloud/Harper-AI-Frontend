# Twilio & ElevenLabs Configuration Guide

## 🚨 Current Issue

The error `accountSid must start with AC` indicates that the Twilio credentials are not properly configured.

## 🔧 Configuration Methods

### Method 1: UI Settings (Recommended for Testing)

1. Start the development server: `npm run dev`
2. Go to http://localhost:3000/settings
3. Click on the **Integrations** tab
4. Fill in your credentials:
   - **Twilio** tab: Account SID, Auth Token, Phone Number
   - **ElevenLabs** tab: API Key, Voice ID, Agent ID
5. Click **Save All Settings**
6. Your credentials are now stored in localStorage and will be used automatically

**Note**: UI settings are stored in your browser's localStorage. They persist across page refreshes but are specific to your browser.

### Method 2: Environment Variables (.env.local)

### 1. Update `.env.local`

Replace the placeholder values in `.env.local` with your actual credentials:

```bash
# Twilio Configuration (REQUIRED)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Must start with 'AC'
TWILIO_AUTH_TOKEN=your_actual_auth_token_here          # 32+ characters
TWILIO_CALLER_NUMBER=+1234567890                       # Your Twilio phone number in E.164 format

# ElevenLabs Configuration (REQUIRED)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your actual API key
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxxxx    # Your agent ID
```

### 2. Get Your Twilio Credentials

1. Log in to [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Get a phone number from Twilio (Phone Numbers → Manage → Active Numbers)

### 3. Get Your ElevenLabs Credentials

1. Log in to [ElevenLabs](https://elevenlabs.io)
2. Go to Profile → API Key
3. Create or copy your API key
4. Get your Agent ID from the Conversational AI section

### 4. Test Your Configuration

```bash
# Run the configuration test
node scripts/test-twilio-config.js

# If successful, start the dev server
npm run dev

# Test the API
curl -X POST http://localhost:3000/api/call/start \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

## 🚀 Render Deployment Setup

### 1. Set Environment Variables in Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Select your service: `harper-ai-frontend`
3. Go to **Environment** tab
4. Add these environment variables:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_CALLER_NUMBER=+1234567890
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Verify Deployment

After setting the environment variables:

1. **Redeploy** your service (Manual Deploy → Deploy)
2. Check the **Logs** tab for any startup errors
3. Test the API endpoint:

```bash
curl -X POST https://harper-ai-frontend-2.onrender.com/api/call/start \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

## 📋 Configuration Flow

```
HarperAI (.env.local or Render env vars)
    ↓
/api/call/start (reads env vars)
    ↓
callRelayService.start() (passes config)
    ↓
relayBootstrap (sets env for subprocess)
    ↓
productiv-ai-relay/index.js (uses env vars)
```

## 🐛 Troubleshooting

### "accountSid must start with AC"
- Your `TWILIO_ACCOUNT_SID` is missing or invalid
- Check it starts with 'AC' followed by 32 hex characters
- Verify no quotes or spaces in the value

### "Failed to start relay"
- Check all 5 required environment variables are set
- Run `node scripts/test-twilio-config.js` to verify
- Check Render logs for detailed error messages

### How Settings Priority Works

1. **UI Settings** (if provided) - Passed from browser localStorage
2. **Environment Variables** - Used as fallback or for production

The system checks both sources and uses whichever is available:
- If you saved credentials in the UI, they'll be used
- If not, it falls back to environment variables
- For Render deployment, always use environment variables

## ✅ Success Indicators

When properly configured, you should see:

1. **In logs**:
   ```
   relay.config {
     twilioAccountSid: "ACxxxx...",
     twilioAuthToken: "[REDACTED]",
     twilioPhoneNumber: "+1234567890",
     elevenLabsAgentId: "agent_xxx",
     port: 8000
   }
   ```

2. **API response**:
   ```json
   {
     "success": true,
     "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
     "status": "initiated"
   }
   ```