#!/usr/bin/env node

/**
 * Setup Credentials Helper
 * Helps you configure Twilio and ElevenLabs credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env.local');

console.log('\n🔧 Harper AI - Credentials Setup\n');
console.log('This script will help you set up your Twilio and ElevenLabs credentials.\n');

// Read existing .env.local
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

const questions = [
  {
    key: 'TWILIO_ACCOUNT_SID',
    prompt: 'Enter your Twilio Account SID (starts with AC):',
    validate: (value) => {
      if (!value.startsWith('AC') || value.length !== 34) {
        return 'Invalid Account SID. It must start with AC and be 34 characters long.';
      }
      return true;
    }
  },
  {
    key: 'TWILIO_AUTH_TOKEN',
    prompt: 'Enter your Twilio Auth Token:',
    validate: (value) => {
      if (value.length < 32) {
        return 'Invalid Auth Token. It should be at least 32 characters long.';
      }
      return true;
    }
  },
  {
    key: 'TWILIO_CALLER_NUMBER',
    prompt: 'Enter your Twilio Phone Number (e.g., +14422663218):',
    default: '+14422663218',
    validate: (value) => {
      if (!value.match(/^\+1[0-9]{10}$/)) {
        return 'Invalid phone number. Use format: +1XXXXXXXXXX';
      }
      return true;
    }
  },
  {
    key: 'ELEVENLABS_API_KEY',
    prompt: 'Enter your ElevenLabs API Key:',
    validate: (value) => {
      if (value.length < 20) {
        return 'Invalid API Key. It should be at least 20 characters long.';
      }
      return true;
    }
  },
  {
    key: 'ELEVENLABS_AGENT_ID',
    prompt: 'Enter your ElevenLabs Agent ID (e.g., agent_xxxxx):',
    validate: (value) => {
      if (!value.startsWith('agent_')) {
        return 'Invalid Agent ID. It should start with "agent_"';
      }
      return true;
    }
  }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    const prompt = question.default ? 
      `${question.prompt} [${question.default}] ` : 
      `${question.prompt} `;
    
    rl.question(prompt, (answer) => {
      const value = answer.trim() || question.default || '';
      
      if (question.validate) {
        const validation = question.validate(value);
        if (validation !== true) {
          console.log(`❌ ${validation}`);
          resolve(askQuestion(question)); // Ask again
          return;
        }
      }
      
      resolve(value);
    });
  });
}

async function updateEnvFile(updates) {
  let newContent = envContent;
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, newLine);
    } else {
      newContent += `\n${newLine}`;
    }
  }
  
  fs.writeFileSync(envPath, newContent);
  console.log('\n✅ Credentials saved to .env.local');
}

async function main() {
  const updates = {};
  
  console.log('📋 Leave blank to keep existing values.\n');
  
  for (const question of questions) {
    const currentValue = envContent.match(new RegExp(`^${question.key}=(.*)$`, 'm'))?.[1];
    
    if (currentValue && !currentValue.includes('your_') && !currentValue.includes('_here')) {
      console.log(`\n✅ ${question.key} already configured`);
      const changeIt = await askQuestion({
        prompt: 'Do you want to change it? (y/N):',
        default: 'N'
      });
      
      if (changeIt.toLowerCase() !== 'y') {
        continue;
      }
    }
    
    console.log('');
    const value = await askQuestion(question);
    updates[question.key] = value;
  }
  
  if (Object.keys(updates).length > 0) {
    await updateEnvFile(updates);
    
    console.log('\n🎉 Configuration complete!\n');
    console.log('Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Run the test: node scripts/quick-call-test.js');
    console.log('3. Answer the phone when it rings!\n');
  } else {
    console.log('\n✅ No changes made.\n');
  }
  
  rl.close();
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled.\n');
  process.exit(0);
});

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});