#!/usr/bin/env node

/**
 * Test Twilio configuration and environment variables
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Twilio Configuration\n');

// Check environment variables
const requiredVars = {
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_CALLER_NUMBER: process.env.TWILIO_CALLER_NUMBER,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID: process.env.ELEVENLABS_AGENT_ID,
};

console.log('Environment Variables:');
console.log('=====================');

let hasErrors = false;

for (const [key, value] of Object.entries(requiredVars)) {
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.log(`❌ ${key}: NOT SET or using placeholder value`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    let displayValue = value;
    if (key.includes('TOKEN') || key.includes('KEY')) {
      displayValue = '[REDACTED]';
    } else if (key === 'TWILIO_ACCOUNT_SID') {
      displayValue = value.substring(0, 6) + '...' + value.substring(value.length - 4);
    }
    console.log(`✅ ${key}: ${displayValue}`);
  }
}

// Validate Twilio Account SID format
if (requiredVars.TWILIO_ACCOUNT_SID && !requiredVars.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  console.log('\n⚠️  WARNING: TWILIO_ACCOUNT_SID must start with "AC"');
  hasErrors = true;
}

// Validate phone number format
if (requiredVars.TWILIO_CALLER_NUMBER && !requiredVars.TWILIO_CALLER_NUMBER.match(/^\+[1-9]\d{1,14}$/)) {
  console.log('\n⚠️  WARNING: TWILIO_CALLER_NUMBER must be in E.164 format (e.g., +1234567890)');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50) + '\n');

if (hasErrors) {
  console.log('❌ Configuration Issues Found!\n');
  console.log('To fix:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Replace placeholder values with your actual credentials');
  console.log('3. Ensure TWILIO_ACCOUNT_SID starts with "AC"');
  console.log('4. Use E.164 format for phone numbers (+1234567890)');
  console.log('\nFor Render deployment:');
  console.log('- Set these environment variables in Render dashboard');
  console.log('- Go to your service → Environment → Add environment variables');
  process.exit(1);
} else {
  console.log('✅ All environment variables are properly configured!\n');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Test: curl -X POST http://localhost:3000/api/call/start -H "Content-Type: application/json" -d \'{"phone": "+1234567890"}\'');
}