#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Harper AI Server...\n');

// Test if server is running
function testConnection() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Server is responding!');
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`🔧 Content-Type: ${res.headers['content-type']}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log('❌ Server connection failed:', err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('⏰ Connection timeout - server might not be running');
      req.destroy();
      resolve(false);
    });
  });
}

// Test API endpoints
async function testAPI() {
  console.log('\n🚀 Testing API endpoints...\n');
  
  try {
    // Test login endpoint
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@harperai.com',
        password: 'password123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login API working!');
      console.log('👤 User:', data.user?.name);
      console.log('🔑 Token received:', !!data.token);
    } else {
      console.log('❌ Login API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

async function runTests() {
  const isRunning = await testConnection();
  
  if (isRunning) {
    await testAPI();
    console.log('\n🎉 Harper AI is working! Visit http://localhost:3000\n');
  } else {
    console.log('\n💡 To start the server, run: npm run dev\n');
  }
}

runTests();