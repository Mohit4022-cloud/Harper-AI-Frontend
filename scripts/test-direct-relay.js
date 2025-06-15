#!/usr/bin/env node

/**
 * Test Direct Relay Functions
 * This bypasses the API and tests the relay functions directly
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testDirectRelay() {
  console.log('\n🧪 Testing Direct Relay Functions\n');
  
  // Show configuration
  console.log('Configuration:');
  console.log('- Twilio SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('- Twilio Phone:', process.env.TWILIO_CALLER_NUMBER);
  console.log('- ElevenLabs Agent:', process.env.ELEVENLABS_AGENT_ID);
  console.log('- Test Phone: +19705677890\n');
  
  try {
    // Import the direct relay functions
    console.log('⏳ Loading direct relay module...');
    const { initializeRelay, startAutoDial, isInitialized } = await import('../src/services/callRelayDirect.ts');
    
    // Check if already initialized
    if (!isInitialized()) {
      console.log('⏳ Initializing relay...');
      
      const config = {
        elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID,
        elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: process.env.TWILIO_CALLER_NUMBER,
        baseUrl: process.env.BASE_URL || 'https://harper-ai-frontend-2.onrender.com'
      };
      
      await initializeRelay(config);
      console.log('✅ Relay initialized\n');
    }
    
    // Make the call
    console.log('📞 Starting call...');
    const result = await startAutoDial({
      to: '+19705677890',
      from: process.env.TWILIO_CALLER_NUMBER,
      script: 'You are a helpful AI assistant for Harper AI. Be friendly and professional.',
      persona: 'Professional, friendly, and helpful sales assistant',
      context: 'This is a test call to verify the voice pipeline is working.'
    });
    
    if (result.success) {
      console.log('\n✅ Call initiated successfully!');
      console.log('- Call SID:', result.callSid);
      console.log('- Request ID:', result.reqId);
      console.log('\n📱 You should receive a call shortly...');
    } else {
      console.log('\n❌ Call failed:', result.error);
      console.log('Details:', result.details);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDirectRelay();