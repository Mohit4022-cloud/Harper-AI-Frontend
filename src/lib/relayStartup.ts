/**
 * Relay Startup Hook
 * Initializes the relay process on application startup
 */

import { ensureRelayIsRunning, getRelayStatus } from './relaySingleton'
import { logger } from './logger'

let startupPromise: Promise<void> | null = null

/**
 * Initialize relay on startup (idempotent)
 */
export async function initializeRelayOnStartup(): Promise<void> {
  // If already starting/started, return the existing promise
  if (startupPromise) {
    return startupPromise
  }

  // Create startup promise
  startupPromise = (async () => {
    try {
      logger.info('[RelayStartup] Initializing relay service on application startup')
      
      // Check if relay should be enabled
      const relayEnabled = process.env.RELAY_ENABLED !== 'false'
      
      if (!relayEnabled) {
        logger.info('[RelayStartup] Relay service is disabled via RELAY_ENABLED=false')
        return
      }

      // Check required environment variables
      const required = [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN', 
        'TWILIO_PHONE_NUMBER',
        'ELEVENLABS_API_KEY',
        'ELEVENLABS_AGENT_ID'
      ]
      
      const missing = required.filter(key => !process.env[key])
      
      if (missing.length > 0) {
        logger.warn('[RelayStartup] Missing required environment variables, relay will start on demand', {
          missing
        })
        return
      }

      // Start the relay
      await ensureRelayIsRunning()
      
      // Get status
      const status = await getRelayStatus()
      
      logger.info('[RelayStartup] Relay service initialized successfully', {
        port: status.port,
        pid: status.pid,
        healthy: status.healthy
      })
      
    } catch (error: any) {
      logger.error('[RelayStartup] Failed to initialize relay service', {
        error: error.message,
        stack: error.stack
      })
      // Don't throw - let the service start on demand instead
    }
  })()

  return startupPromise
}

// Auto-initialize on module load if not in test environment
if (process.env.NODE_ENV !== 'test' && typeof process !== 'undefined') {
  // Delay startup to avoid blocking the main thread
  setTimeout(() => {
    initializeRelayOnStartup().catch(err => {
      logger.error('[RelayStartup] Background initialization failed', err)
    })
  }, 1000)
}