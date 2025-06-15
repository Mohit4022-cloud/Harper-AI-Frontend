/**
 * Next.js Instrumentation
 * Runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server
    const { initializeRelayOnStartup } = await import('./src/lib/relayStartup')
    
    console.log('[Instrumentation] Initializing relay service...')
    
    // Initialize relay in the background
    initializeRelayOnStartup().catch(err => {
      console.error('[Instrumentation] Failed to initialize relay:', err)
    })
  }
}