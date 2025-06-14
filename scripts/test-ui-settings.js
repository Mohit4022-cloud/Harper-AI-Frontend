#!/usr/bin/env node

/**
 * Test if UI settings are properly stored and can be retrieved
 */

const { chromium } = require('playwright');

async function testUISettings() {
  console.log('🔍 Testing UI Settings Storage\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to your local app
    await page.goto('http://localhost:3000/settings');
    
    // Wait for settings to load
    await page.waitForTimeout(2000);
    
    // Get localStorage data
    const settings = await page.evaluate(() => {
      const stored = localStorage.getItem('user-settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.state?.settings?.integrations || null;
        } catch (e) {
          return null;
        }
      }
      return null;
    });
    
    if (settings) {
      console.log('✅ Found UI Settings in localStorage:\n');
      console.log('Twilio Account SID:', settings.twilioAccountSid ? 
        `${settings.twilioAccountSid.substring(0, 6)}...` : 'NOT SET');
      console.log('Twilio Auth Token:', settings.twilioAuthToken ? '[SET]' : 'NOT SET');
      console.log('Twilio Phone:', settings.twilioCallerNumber || 'NOT SET');
      console.log('ElevenLabs Key:', settings.elevenLabsKey ? '[SET]' : 'NOT SET');
      console.log('ElevenLabs Agent ID:', settings.elevenLabsAgentId || 'NOT SET');
      
      // Test API with UI settings
      console.log('\n📞 Testing API with UI settings...\n');
      
      const response = await fetch('http://localhost:3000/api/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1234567890' })
      });
      
      const result = await response.json();
      console.log('API Response:', JSON.stringify(result, null, 2));
      
    } else {
      console.log('❌ No UI settings found in localStorage');
      console.log('\nTo set them:');
      console.log('1. Go to http://localhost:3000/settings');
      console.log('2. Click on the Integrations tab');
      console.log('3. Fill in your Twilio and ElevenLabs credentials');
      console.log('4. Click "Save All Settings"');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Simple version without Playwright
async function testUISettingsSimple() {
  console.log('🔍 Testing UI Settings via API\n');
  
  try {
    // First, get the current settings
    const settingsResponse = await fetch('http://localhost:3000/api/settings');
    const settingsData = await settingsResponse.json();
    
    if (settingsData.success && settingsData.data?.integrations) {
      const integrations = settingsData.data.integrations;
      
      console.log('✅ Current Settings from API:\n');
      console.log('Twilio Account SID:', integrations.twilioAccountSid ? 
        `${integrations.twilioAccountSid.substring(0, 6)}...` : 'NOT SET');
      console.log('Twilio Auth Token:', integrations.twilioAuthToken ? '[SET]' : 'NOT SET');
      console.log('Twilio Phone:', integrations.twilioCallerNumber || 'NOT SET');
      console.log('ElevenLabs Key:', integrations.elevenLabsKey ? '[SET]' : 'NOT SET');
      console.log('ElevenLabs Agent ID:', integrations.elevenLabsAgentId || 'NOT SET');
      
      // Check if credentials look valid
      const hasValidCreds = 
        integrations.twilioAccountSid && 
        integrations.twilioAccountSid.startsWith('AC') &&
        integrations.twilioAuthToken &&
        integrations.twilioCallerNumber &&
        integrations.elevenLabsKey &&
        integrations.elevenLabsAgentId;
      
      if (hasValidCreds) {
        console.log('\n✅ All credentials appear to be set!\n');
        console.log('You can test calling with:');
        console.log('curl -X POST http://localhost:3000/api/call/start \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"phone": "+1234567890"}\'');
      } else {
        console.log('\n⚠️  Some credentials are missing or invalid');
      }
    } else {
      console.log('❌ Could not fetch settings from API');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the server is running: npm run dev');
  }
}

// Run the simple version (no Playwright needed)
testUISettingsSimple();