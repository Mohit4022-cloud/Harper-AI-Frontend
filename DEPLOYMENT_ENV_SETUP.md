# Harper AI Frontend - Environment Variables Setup Guide

## Required Environment Variables for Render Deployment

Copy and paste these environment variables into your Render dashboard:

### Core Application Settings

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://harper-ai-frontend-2.onrender.com
```

### Authentication & Security

```
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
SESSION_SECRET=<generate-secure-random-string>
```

### Database (Provided by Render)

```
DATABASE_URL=<automatically-provided-by-render>
```

### Third-Party API Keys (REQUIRED)

```
# Twilio - For phone calling functionality
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_CALLER_NUMBER=<your-twilio-phone-number>

# ElevenLabs - For AI voice synthesis
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
ELEVENLABS_AGENT_ID=<your-elevenlabs-agent-id>
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Google Gemini - For AI content generation
GEMINI_API_KEY=<your-gemini-api-key>
```

### Optional but Recommended

```
# Sentry - For error tracking
SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
SENTRY_ORG=<your-sentry-org>
SENTRY_PROJECT=<your-sentry-project>

# Performance & Monitoring
LOG_LEVEL=info
NEXT_PUBLIC_APP_VERSION=1.1.0
```

### Rate Limiting & Security

```
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://harper-ai-frontend-2.onrender.com
```

## How to Generate Secure Secrets

### Option 1: Using OpenSSL (Recommended)

```bash
openssl rand -base64 32
```

### Option 2: Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Using an online generator

Visit: https://generate-secret.vercel.app/32

## Setting Environment Variables in Render

1. Go to your Render dashboard
2. Select your service (harper-ai-frontend)
3. Click on "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable one by one
6. Click "Save Changes"
7. Your service will automatically redeploy

## Verification

After deployment, verify your environment variables are set correctly by:

1. Checking the deployment logs in Render
2. Visiting `/api/health` endpoint to see system status
3. Testing core functionality (login, API calls, etc.)

## Important Notes

- Never commit sensitive API keys to your repository
- Rotate your secrets regularly
- Use different API keys for staging vs production
- Monitor your API usage to prevent overage charges
