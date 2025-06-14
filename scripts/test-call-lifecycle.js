#!/usr/bin/env node

/**
 * Test Call Lifecycle Script
 * 
 * This script tests the full Twilio + ElevenLabs call lifecycle
 * and helps debug connection issues
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_PHONE = process.env.TEST_PHONE_NUMBER || '+1234567890'; // Replace with your test number

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const color = {
    info: colors.blue,
    success: colors.green,
    warn: colors.yellow,
    error: colors.red,
    debug: colors.cyan
  }[level] || colors.reset;
  
  console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
  if (Object.keys(data).length > 0) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testConfiguration() {
  log('info', '🔍 Testing configuration...');
  
  const config = {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_CALLER_NUMBER,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID,
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
    baseUrl: process.env.BASE_URL || API_URL
  };
  
  // Check configuration
  const missing = [];
  if (!config.twilioAccountSid) missing.push('TWILIO_ACCOUNT_SID');
  if (!config.twilioAuthToken) missing.push('TWILIO_AUTH_TOKEN');
  if (!config.twilioPhoneNumber) missing.push('TWILIO_CALLER_NUMBER');
  if (!config.elevenLabsApiKey) missing.push('ELEVENLABS_API_KEY');
  if (!config.elevenLabsAgentId) missing.push('ELEVENLABS_AGENT_ID');
  
  if (missing.length > 0) {
    log('error', `Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  log('success', 'Configuration check passed', {
    twilioAccountSid: config.twilioAccountSid.substring(0, 6) + '...',
    twilioPhoneNumber: config.twilioPhoneNumber,
    elevenLabsAgentId: config.elevenLabsAgentId,
    elevenLabsVoiceId: config.elevenLabsVoiceId || 'default',
    baseUrl: config.baseUrl
  });
  
  return true;
}

async function testElevenLabsConnection() {
  log('info', '🔊 Testing ElevenLabs connection...');
  
  try {
    // Test ElevenLabs API
    const response = await axios.get(
      'https://api.elevenlabs.io/v1/user',
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      }
    );
    
    log('success', 'ElevenLabs API connection successful', {
      subscription: response.data.subscription,
      character_count: response.data.subscription.character_count,
      character_limit: response.data.subscription.character_limit
    });
    
    // Test signed URL generation
    try {
      const signedUrlResponse = await axios.get(
        'https://api.elevenlabs.io/v1/convai/conversation/get-signed-url',
        {
          params: { agent_id: process.env.ELEVENLABS_AGENT_ID },
          headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
        }
      );
      
      log('success', 'ElevenLabs signed URL obtained', {
        hasSignedUrl: !!signedUrlResponse.data.signed_url
      });
      
      return true;
    } catch (error) {
      log('error', 'Failed to get ElevenLabs signed URL', {
        error: error.response?.data || error.message,
        agentId: process.env.ELEVENLABS_AGENT_ID
      });
      return false;
    }
    
  } catch (error) {
    log('error', 'ElevenLabs API connection failed', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    return false;
  }
}

async function startTestCall() {
  log('info', '📞 Starting test call...');
  
  try {
    const response = await axios.post(
      `${API_URL}/api/call/start`,
      {
        phone: TEST_PHONE,
        settings: {
          integrations: {
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
            twilioCallerNumber: process.env.TWILIO_CALLER_NUMBER,
            elevenLabsKey: process.env.ELEVENLABS_API_KEY,
            elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': `test-${Date.now()}`
        }
      }
    );
    
    if (response.data.success) {
      log('success', 'Call initiated successfully', {
        callSid: response.data.callSid,
        from: response.data.from,
        to: response.data.to,
        status: response.data.status
      });
      
      return response.data.callSid;
    } else {
      log('error', 'Call initiation failed', response.data);
      return null;
    }
  } catch (error) {
    log('error', 'Failed to start call', {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    return null;
  }
}

async function monitorCallTranscript(callSid) {
  log('info', '📝 Monitoring call transcript...');
  
  let attempts = 0;
  const maxAttempts = 30; // Monitor for up to 30 seconds
  let lastTranscriptCount = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await axios.get(
        `${API_URL}/api/call/transcript?callSid=${callSid}`
      );
      
      const transcript = response.data.transcript || [];
      
      if (transcript.length > lastTranscriptCount) {
        const newEntries = transcript.slice(lastTranscriptCount);
        newEntries.forEach(entry => {
          const prefix = entry.role === 'agent' ? '🤖' : '👤';
          log('info', `${prefix} ${entry.role}: ${entry.text}`);
        });
        lastTranscriptCount = transcript.length;
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        log('warn', 'Transcript monitoring timeout', {
          totalEntries: transcript.length
        });
      }
      
    } catch (error) {
      log('debug', 'Transcript fetch attempt', {
        attempt: attempts,
        error: error.message
      });
    }
  }, 1000);
}

async function runTests() {
  console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════╗
║     Harper AI - Call Lifecycle Test                   ║
║     Testing Twilio + ElevenLabs Integration           ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}`);

  // Step 1: Test configuration
  if (!await testConfiguration()) {
    log('error', 'Configuration test failed. Please check your .env.local file');
    return;
  }
  
  // Step 2: Test ElevenLabs connection
  if (!await testElevenLabsConnection()) {
    log('error', 'ElevenLabs connection test failed');
    return;
  }
  
  // Step 3: Start test call
  log('info', `📱 Test phone number: ${TEST_PHONE}`);
  log('warn', 'Make sure this is a valid number you can answer!');
  
  const callSid = await startTestCall();
  if (!callSid) {
    log('error', 'Failed to start test call');
    return;
  }
  
  // Step 4: Monitor transcript
  await monitorCallTranscript(callSid);
  
  // Summary
  setTimeout(() => {
    console.log(`
${colors.bright}${colors.green}
═══════════════════════════════════════════════════════
Test Summary:
- Configuration: ✓
- ElevenLabs Connection: ✓
- Call Initiated: ✓
- Call SID: ${callSid}

Next Steps:
1. Check if you received the call
2. Verify you heard the AI voice
3. Check logs for any errors
4. Review transcript above
═══════════════════════════════════════════════════════
${colors.reset}`);
  }, 35000);
}

// Run tests
runTests().catch(error => {
  log('error', 'Test script failed', { error: error.message });
  process.exit(1);
});