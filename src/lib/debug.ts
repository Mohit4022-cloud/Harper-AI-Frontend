// Debug utilities for troubleshooting environment issues

export const debugEnvironment = () => {
  if (typeof window !== 'undefined') {
    console.log('🔍 Environment Debug Info:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('- Window Origin:', window.location.origin)
    console.log('- Current URL:', window.location.href)
  }
}

// Call this in development to debug
if (process.env.NODE_ENV === 'development') {
  debugEnvironment()
}