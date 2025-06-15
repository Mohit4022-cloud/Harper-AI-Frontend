#!/usr/bin/env node

/**
 * Start Relay Server
 * Run this script to start the WebSocket relay for full conversation support
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting WebSocket Relay Server...\n');

// Set environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// The relay expects different env var names, so map them
const relayEnv = {
  ...process.env,
  PORT: '8000',
  NODE_ENV: 'development',
  // Map from our env vars to what the relay expects
  ELEVENLABS_AGENT_ID: process.env.ELEVENLABS_AGENT_ID,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_CALLER_NUMBER, // Note: different name
};

console.log('🔧 Configuration:');
console.log(`- Twilio SID: ${relayEnv.TWILIO_ACCOUNT_SID?.substring(0, 6)}...`);
console.log(`- Twilio Phone: ${relayEnv.TWILIO_PHONE_NUMBER}`);
console.log(`- ElevenLabs Agent: ${relayEnv.ELEVENLABS_AGENT_ID}`);
console.log('');

// Start the relay
const relay = spawn('node', [
  path.join(__dirname, '..', 'src', 'lib', 'productiv-ai-relay', 'index.js')
], {
  env: relayEnv,
  stdio: 'inherit'
});

relay.on('error', (err) => {
  console.error('❌ Failed to start relay:', err.message);
  process.exit(1);
});

relay.on('exit', (code) => {
  console.log(`\n📴 Relay exited with code ${code}`);
  process.exit(code || 0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down relay...');
  relay.kill('SIGTERM');
});

console.log('📡 Relay server starting on port 8000...');
console.log('🔗 WebSocket endpoint: ws://localhost:8000/media-stream');
console.log('\nPress Ctrl+C to stop\n');