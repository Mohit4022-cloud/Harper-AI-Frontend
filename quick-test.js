// Quick test to verify Harper AI is working
const http = require('http');

console.log('🧪 Harper AI Quick Test\n');

// Test basic server connectivity
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Server Status:', res.statusCode);
  console.log('📦 Content-Type:', res.headers['content-type']);
  
  if (res.statusCode === 200) {
    console.log('\n🎉 SUCCESS! Harper AI is running!');
    console.log('🌐 Open: http://localhost:3000');
    console.log('👤 Login: demo@harperai.com / password123');
  }
});

req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ Server not running. Start with: npm run dev');
  } else {
    console.log('❌ Error:', err.message);
  }
});

req.setTimeout(5000, () => {
  console.log('⏰ Timeout - server may be starting...');
  req.destroy();
});

req.end();