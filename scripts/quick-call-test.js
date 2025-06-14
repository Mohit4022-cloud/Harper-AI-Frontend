#!/usr/bin/env node

/**
 * Quick Call Test
 * Tests the calling pipeline with your specific phone number
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const TEST_PHONE = '+19705677890'; // Your test number with US country code
const TWILIO_CALLER = '+14422663218'; // Your Twilio number

console.log('\n🚀 Harper AI - Quick Call Test\n');
console.log(`📞 Calling: ${TEST_PHONE}`);
console.log(`📱 From: ${TWILIO_CALLER}`);
console.log(`🔗 API URL: ${API_URL}\n`);

async function makeTestCall() {
  try {
    console.log('⏳ Initiating call...\n');
    
    const response = await axios.post(
      `${API_URL}/api/call/start`,
      {
        phone: TEST_PHONE,
        settings: {
          integrations: {
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
            twilioCallerNumber: TWILIO_CALLER,
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
      console.log('✅ Call initiated successfully!\n');
      console.log('Call Details:');
      console.log(`- Call SID: ${response.data.callSid}`);
      console.log(`- Status: ${response.data.status}`);
      console.log(`- From: ${response.data.from}`);
      console.log(`- To: ${response.data.to}`);
      console.log(`- Direction: ${response.data.direction || 'outbound-api'}`);
      
      console.log('\n📱 You should receive a call shortly...');
      console.log('🎧 Listen for:');
      console.log('   1. "Connecting you to the AI assistant"');
      console.log('   2. AI voice message (if ElevenLabs is working)');
      console.log('   3. Any error messages\n');
      
      // Monitor transcript
      console.log('📝 Monitoring transcript for 30 seconds...\n');
      monitorTranscript(response.data.callSid);
      
    } else {
      console.error('❌ Call failed:', response.data);
    }
  } catch (error) {
    console.error('\n❌ Error making call:');
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    
    // Common error fixes
    console.log('\n💡 Common issues:');
    console.log('1. Check if the server is running (npm run dev)');
    console.log('2. Verify your .env.local has all required variables');
    console.log('3. Make sure your Twilio account has funds');
    console.log('4. Verify the phone number format (+1 for US numbers)');
  }
}

async function monitorTranscript(callSid) {
  let attempts = 0;
  const maxAttempts = 30;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await axios.get(
        `${API_URL}/api/call/transcript?callSid=${callSid}`
      );
      
      const transcript = response.data.transcript || [];
      
      if (transcript.length > 0) {
        console.log('\n📝 Transcript:');
        transcript.forEach(entry => {
          const prefix = entry.role === 'agent' ? '🤖 AI' : '👤 User';
          console.log(`${prefix}: ${entry.text}`);
        });
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.log('\n⏱️ No transcript received (this is normal without WebSocket streaming)');
        clearInterval(interval);
      }
    } catch (error) {
      // Silently continue
    }
  }, 1000);
}

// Check configuration first
console.log('🔍 Checking configuration...\n');

const config = {
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuth: process.env.TWILIO_AUTH_TOKEN,
  elevenLabsKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsAgent: process.env.ELEVENLABS_AGENT_ID
};

const missing = [];
if (!config.twilioSid) missing.push('TWILIO_ACCOUNT_SID');
if (!config.twilioAuth) missing.push('TWILIO_AUTH_TOKEN');
if (!config.elevenLabsKey) missing.push('ELEVENLABS_API_KEY');
if (!config.elevenLabsAgent) missing.push('ELEVENLABS_AGENT_ID');

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  console.log('\n💡 Add these to your .env.local file');
  process.exit(1);
}

console.log('✅ Configuration OK\n');
console.log('- Twilio SID:', config.twilioSid.substring(0, 6) + '...');
console.log('- ElevenLabs Agent:', config.elevenLabsAgent);
console.log('- Has Twilio Auth:', !!config.twilioAuth);
console.log('- Has ElevenLabs Key:', !!config.elevenLabsKey);
console.log('\n---\n');

// Make the call
makeTestCall();