// ==== Global Crash & Exit Handlers ====
process.on('uncaughtException', (err) => {
  console.error('🛑 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🧨 Unhandled Rejection:', reason);
});
process.on('exit', (code) => {
  console.log(`🔚 Process exited with code ${code}`);
});
// ======================================

// 🐙 Persist every console log to a local file
const fs = require('fs');
const logFile = fs.createWriteStream('./next.debug.log', { flags: 'a' });

['log', 'error', 'warn'].forEach((fn) => {
  const orig = console[fn].bind(console);
  console[fn] = (...args) => {
    orig(...args);
    logFile.write(
      `[${fn.toUpperCase()}] ${new Date().toISOString()} ${args.join(' ')}\n`
    );
  };
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for debugging
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : 'https://harper-ai-frontend-1.onrender.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      }
    ]
  }
};

module.exports = nextConfig;