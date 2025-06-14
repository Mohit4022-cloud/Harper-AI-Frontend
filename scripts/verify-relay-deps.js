#!/usr/bin/env node

/**
 * Verify that all relay dependencies are properly installed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying relay dependencies...\n');

// Check main project dependencies
const mainPackageJson = require('../package.json');
const relayPackageJson = require('../src/lib/productiv-ai-relay/package.json');

const requiredDeps = Object.entries(relayPackageJson.dependencies);
const missingDeps = [];
const versionMismatches = [];

for (const [dep, relayVersion] of requiredDeps) {
  const mainVersion = mainPackageJson.dependencies[dep];
  
  if (!mainVersion) {
    missingDeps.push(`${dep}@${relayVersion}`);
  } else if (dep !== 'ws' && mainVersion !== relayVersion) {
    // Allow ws to have different version due to peer dependency
    versionMismatches.push({
      dep,
      relayVersion,
      mainVersion
    });
  }
}

// Check if dependencies are actually installed
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const notInstalled = [];

for (const [dep] of requiredDeps) {
  const depPath = path.join(nodeModulesPath, dep);
  if (!fs.existsSync(depPath)) {
    notInstalled.push(dep);
  }
}

// Report results
if (missingDeps.length === 0 && versionMismatches.length === 0 && notInstalled.length === 0) {
  console.log('✅ All relay dependencies are properly configured!\n');
} else {
  console.log('❌ Dependency issues found:\n');
  
  if (missingDeps.length > 0) {
    console.log('Missing from package.json:');
    missingDeps.forEach(dep => console.log(`  - ${dep}`));
    console.log('\nAdd these to your package.json dependencies.');
  }
  
  if (versionMismatches.length > 0) {
    console.log('\nVersion mismatches:');
    versionMismatches.forEach(({ dep, relayVersion, mainVersion }) => {
      console.log(`  - ${dep}: relay wants ${relayVersion}, main has ${mainVersion}`);
    });
  }
  
  if (notInstalled.length > 0) {
    console.log('\nNot installed in node_modules:');
    notInstalled.forEach(dep => console.log(`  - ${dep}`));
    console.log('\nRun: npm install');
  }
  
  process.exit(1);
}

// Check environment variables
console.log('🔐 Checking environment variables...\n');

const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_CALLER_NUMBER',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_AGENT_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length === 0) {
  console.log('✅ All required environment variables are set!\n');
} else {
  console.log('⚠️  Missing environment variables:');
  missingEnvVars.forEach(envVar => console.log(`  - ${envVar}`));
  console.log('\nSet these in your .env.local file or Render dashboard.');
}

console.log('\n📦 Relay setup verification complete!');