// Global error and exit logging
process.on('uncaughtException', (err) => {
  console.error('🛑 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🛑 Unhandled Rejection:', reason);
});
process.on('exit', (code) => {
  console.log(`🔚 Process exiting with code: ${code}`);
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for debugging
};

module.exports = nextConfig;