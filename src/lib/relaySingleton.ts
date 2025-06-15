/**
 * Relay Singleton Bootstrap Module
 * Manages a single long-lived relay process for production-grade reliability
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import axios from 'axios'
import { logger } from './logger'

// Singleton state
let relayProcess: ChildProcess | null = null
let isShuttingDown = false
let restartCount = 0
const MAX_RESTART_ATTEMPTS = 3

// Configuration
const RELAY_PORT = process.env.RELAY_PORT || '8000'
const RELAY_HEALTH_URL = `http://localhost:${RELAY_PORT}/health`
const RELAY_STARTUP_TIMEOUT = 30000 // 30 seconds
const HEALTH_CHECK_INTERVAL = 1000 // 1 second
const HEALTH_CHECK_RETRIES = 5

/**
 * Check if relay is healthy
 */
async function isRelayHealthy(): Promise<boolean> {
  try {
    logger.debug({ url: RELAY_HEALTH_URL }, '[RelaySingleton] Checking relay health')
    
    const response = await axios.get(RELAY_HEALTH_URL, { 
      timeout: 2000,
      validateStatus: (status) => status === 200 
    })
    
    const isHealthy = response.data.status === 'healthy' || response.data.status === 'ok'
    
    logger.debug({ 
      url: RELAY_HEALTH_URL,
      status: response.status,
      data: response.data,
      isHealthy
    }, '[RelaySingleton] Health check result')
    
    return isHealthy
  } catch (error: any) {
    logger.debug({ 
      url: RELAY_HEALTH_URL,
      error: error.code || error.message
    }, '[RelaySingleton] Health check failed')
    return false
  }
}

/**
 * Wait for relay to become healthy
 */
async function waitForRelayHealth(timeoutMs: number = RELAY_STARTUP_TIMEOUT): Promise<boolean> {
  const startTime = Date.now()
  let attempts = 0
  
  logger.info({ timeoutMs }, '[RelaySingleton] Waiting for relay to become healthy')
  
  while (Date.now() - startTime < timeoutMs) {
    attempts++
    
    if (await isRelayHealthy()) {
      const duration = Date.now() - startTime
      logger.info({ 
        attempts,
        duration 
      }, '[RelaySingleton] Relay is healthy')
      return true
    }
    
    logger.debug({ 
      attempt: attempts,
      elapsed: Date.now() - startTime,
      nextCheckIn: HEALTH_CHECK_INTERVAL
    }, '[RelaySingleton] Relay not ready, waiting...')
    
    await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL))
  }
  
  return false
}

/**
 * Spawn the relay process
 */
async function spawnRelay(): Promise<ChildProcess> {
  const relayPath = path.join(process.cwd(), 'src/lib/productiv-ai-relay')
  
  logger.info({
    path: relayPath,
    port: RELAY_PORT
  }, '[RelayBootstrap] Spawning new relay process')

  // Set up environment variables
  const env = {
    ...process.env,
    PORT: RELAY_PORT,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }

  // Spawn the process
  const child = spawn('node', ['index.js'], {
    cwd: relayPath,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  })

  // Handle stdout
  child.stdout?.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      logger.debug({ source: 'relay_stdout' }, `[Relay] ${message}`)
    }
  })

  // Handle stderr
  child.stderr?.on('data', (data) => {
    const message = data.toString().trim()
    if (message) {
      logger.error({ source: 'relay_stderr' }, `[Relay Error] ${message}`)
    }
  })

  // Handle process exit
  child.on('exit', (code, signal) => {
    logger.warn({ 
      code, 
      signal, 
      pid: child.pid,
      restartCount 
    }, '[RelayBootstrap] Relay process exited')
    
    relayProcess = null
    
    // Auto-restart if not shutting down and under restart limit
    if (!isShuttingDown && restartCount < MAX_RESTART_ATTEMPTS) {
      restartCount++
      logger.info({ 
        attempt: restartCount,
        maxAttempts: MAX_RESTART_ATTEMPTS 
      }, '[RelayBootstrap] Attempting to restart relay')
      
      setTimeout(() => {
        ensureRelayIsRunning().catch(err => {
          logger.error(err, '[RelayBootstrap] Failed to restart relay')
        })
      }, 1000 * restartCount) // Exponential backoff
    }
  })

  // Handle spawn errors
  child.on('error', (error) => {
    logger.error({
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      },
      pid: child.pid
    }, '[RelayBootstrap] Failed to spawn relay process')
  })

  logger.info({ 
    pid: child.pid,
    port: RELAY_PORT 
  }, '[RelayBootstrap] Spawned new relay')
  
  return child
}

/**
 * Ensure the relay is running (singleton pattern)
 */
export async function ensureRelayIsRunning(): Promise<void> {
  const startTime = Date.now()
  logger.debug('[RelayBootstrap] Ensuring relay is running')
  
  // If we already have a process, check if it's still alive
  if (relayProcess && !relayProcess.killed) {
    logger.debug({ pid: relayProcess.pid }, '[RelayBootstrap] Checking existing relay process')
    
    // Verify it's actually responding
    if (await isRelayHealthy()) {
      logger.debug({ 
        pid: relayProcess.pid,
        duration: Date.now() - startTime
      }, '[RelayBootstrap] Existing relay is healthy')
      return
    } else {
      logger.warn({ 
        pid: relayProcess.pid 
      }, '[RelayBootstrap] Existing relay process not responding, will restart')
      killRelay()
    }
  }

  // Check if another instance is already running (from previous run)
  if (await isRelayHealthy()) {
    logger.info(`[RelayBootstrap] Existing relay detected, reusing on port ${RELAY_PORT}`)
    return
  }

  // Try to spawn a new relay
  let attempts = 0
  const maxAttempts = 3
  
  while (attempts < maxAttempts) {
    attempts++
    
    try {
      relayProcess = await spawnRelay()
      
      // Wait for it to become healthy
      const isHealthy = await waitForRelayHealth()
      
      if (isHealthy) {
        logger.info({ 
          port: RELAY_PORT,
          pid: relayProcess.pid 
        }, '[RelayBootstrap] Relay is ready')
        return
      } else {
        throw new Error('Relay failed health check after startup')
      }
      
    } catch (error: any) {
      logger.error({
        attempt: attempts,
        maxAttempts,
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      }, '[RelayBootstrap] Failed to start relay')
      
      // Kill the process if it exists
      if (relayProcess) {
        killRelay()
      }
      
      // Check for specific errors
      if (error.message?.includes('EADDRINUSE')) {
        logger.info('[RelayBootstrap] Port already in use, checking if it\'s a healthy relay')
        
        // Give it a moment for the existing process to fully start
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (await isRelayHealthy()) {
          logger.info('[RelayBootstrap] Found healthy relay on port, reusing it')
          return
        }
      }
      
      // If not the last attempt, wait before retrying
      if (attempts < maxAttempts) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 10000)
        logger.info({ 
          backoffMs,
          nextAttempt: attempts + 1,
          maxAttempts
        }, '[RelayBootstrap] Waiting before retry')
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }
  
  const totalDuration = Date.now() - startTime
  logger.error({ 
    maxAttempts,
    totalDuration,
    restartCount
  }, '[RelayBootstrap] Failed to start relay after all attempts')
  
  throw new Error(`Failed to start relay after ${maxAttempts} attempts`)
}

/**
 * Kill the relay process
 */
function killRelay(): void {
  if (relayProcess && !relayProcess.killed) {
    logger.info({ pid: relayProcess.pid }, '[RelayBootstrap] Killing relay process')
    relayProcess.kill('SIGTERM')
    relayProcess = null
  }
}

/**
 * Graceful shutdown handler
 */
export async function shutdownRelay(): Promise<void> {
  isShuttingDown = true
  killRelay()
  
  // Give it a moment to clean up
  await new Promise(resolve => setTimeout(resolve, 1000))
}

/**
 * Get relay status
 */
export async function getRelayStatus(): Promise<{
  running: boolean
  healthy: boolean
  port: string
  pid?: number
  restartCount: number
}> {
  const running = relayProcess !== null && !relayProcess.killed
  const healthy = await isRelayHealthy()
  
  return {
    running,
    healthy,
    port: RELAY_PORT,
    pid: relayProcess?.pid,
    restartCount
  }
}

// Register shutdown handlers
if (typeof process !== 'undefined') {
  const handleShutdown = (signal: string) => {
    logger.info(`[RelayBootstrap] Received ${signal}, shutting down relay`)
    shutdownRelay().then(() => {
      process.exit(0)
    }).catch(err => {
      logger.error(err, '[RelayBootstrap] Error during shutdown')
      process.exit(1)
    })
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
  
  // Also handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error(error, '[RelayBootstrap] Uncaught exception')
    shutdownRelay()
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, '[RelayBootstrap] Unhandled rejection')
  })
}

// Export relay URL for convenience
export const RELAY_BASE_URL = `http://localhost:${RELAY_PORT}`