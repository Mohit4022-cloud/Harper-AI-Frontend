// Debug utilities for troubleshooting environment issues
// Only active in development mode

export const debugEnvironment = () => {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  if (typeof window !== 'undefined') {
    console.log('🔍 Environment Debug Info:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('- Window Origin:', window.location.origin)
    console.log('- Current URL:', window.location.href)
  }
}

// Log function that only works in development
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args);
  }
}

// Error logging that includes stack traces in development
export const devError = (message: string, error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[DEV ERROR] ${message}:`, error);
    if (error?.stack) {
      console.error('[DEV STACK]:', error.stack);
    }
  } else {
    // In production, log minimal error info
    console.error(message);
  }
}

// Call this in development to debug (auto-run disabled for production)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only run once after page load
  window.addEventListener('load', () => {
    debugEnvironment();
  }, { once: true });
}