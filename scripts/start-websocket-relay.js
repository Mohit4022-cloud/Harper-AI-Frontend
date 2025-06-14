#!/usr/bin/env node

/**
 * Start WebSocket Relay Server
 * 
 * This script starts a separate WebSocket server for handling
 * real-time audio streaming between Twilio and ElevenLabs
 */

const { startWebSocketRelay } = require('../dist/services/websocketRelay');

const PORT = process.env.WEBSOCKET_RELAY_PORT || 8001;

console.log(`Starting WebSocket relay server on port ${PORT}...`);

try {
  startWebSocketRelay(PORT);
} catch (error) {
  console.error('Failed to start WebSocket relay:', error);
  process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket relay...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down WebSocket relay...');
  process.exit(0);
});