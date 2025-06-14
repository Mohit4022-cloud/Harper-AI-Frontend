/**
 * Relay Bootstrap Module
 * Handles starting the productiv-ai-relay service with retry logic and proper error handling
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { logger } from './logger'

export interface RelayConfig {
  elevenLabsAgentId: string
  elevenLabsApiKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  relayPort?: number
}

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffFactor?: number
  timeoutMs?: number
}

export class RelayStartupError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError?: Error
  ) {
    super(message)
    this.name = 'RelayStartupError'
  }
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: parseInt(process.env.RELAY_MAX_ATTEMPTS || '3', 10),
  initialDelayMs: parseInt(process.env.RELAY_INITIAL_DELAY_MS || '1000', 10),
  maxDelayMs: parseInt(process.env.RELAY_MAX_DELAY_MS || '10000', 10),
  backoffFactor: parseFloat(process.env.RELAY_BACKOFF_FACTOR || '2'),
  timeoutMs: parseInt(process.env.RELAY_STARTUP_TIMEOUT_MS || '30000', 10),
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffFactor, attempt - 1)
  return Math.min(delay, options.maxDelayMs)
}

/**
 * Start relay process with timeout
 */
async function startRelayProcess(
  config: RelayConfig,
  timeoutMs: number
): Promise<ChildProcess> {
  const relayPath = path.join(process.cwd(), 'src/lib/productiv-ai-relay')
  const port = config.relayPort || 8000

  // Check if relay directory exists
  const fs = await import('fs/promises')
  try {
    await fs.access(relayPath)
  } catch (error) {
    throw new Error(`Relay directory not found at ${relayPath}. Ensure git submodule is initialized.`)
  }

  // Set up environment variables
  const env = {
    ...process.env,
    ELEVENLABS_AGENT_ID: config.elevenLabsAgentId,
    ELEVENLABS_API_KEY: config.elevenLabsApiKey,
    TWILIO_ACCOUNT_SID: config.twilioAccountSid,
    TWILIO_AUTH_TOKEN: config.twilioAuthToken,
    TWILIO_PHONE_NUMBER: config.twilioPhoneNumber,
    PORT: port.toString(),
  }

  return new Promise((resolve, reject) => {
    const relayProcess = spawn('node', ['index.js'], {
      cwd: relayPath,
      env,
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    let started = false
    let startupOutput = ''
    let errorOutput = ''
    let timeoutHandle: NodeJS.Timeout

    // Set timeout
    timeoutHandle = setTimeout(() => {
      if (!started) {
        relayProcess.kill('SIGTERM')
        reject(new Error(`Relay startup timed out after ${timeoutMs}ms`))
      }
    }, timeoutMs)

    // Handle stdout
    relayProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      startupOutput += output
      logger.debug({ output }, 'relay.stdout')
      
      // Check if server is ready
      if (output.includes('Server listening on')) {
        started = true
        clearTimeout(timeoutHandle)
        resolve(relayProcess)
      }
    })

    // Handle stderr
    relayProcess.stderr?.on('data', (data) => {
      const error = data.toString()
      errorOutput += error
      logger.error({ error }, 'relay.stderr')
    })

    // Handle process errors
    relayProcess.on('error', (error) => {
      clearTimeout(timeoutHandle)
      logger.error({ error }, 'relay.spawn.error')
      
      // Check for common errors
      if (error.message.includes('ENOENT')) {
        reject(new Error('Node.js not found. Ensure Node.js is in PATH.'))
      } else {
        reject(error)
      }
    })

    // Handle early exit
    relayProcess.on('exit', (code, signal) => {
      if (!started) {
        clearTimeout(timeoutHandle)
        const exitReason = signal ? `killed by signal ${signal}` : `exited with code ${code}`
        const fullError = `Relay process ${exitReason}.\nStdout: ${startupOutput}\nStderr: ${errorOutput}`
        
        // Parse common errors
        if (errorOutput.includes('Cannot find module') || errorOutput.includes('MODULE_NOT_FOUND')) {
          reject(new Error(`Missing dependencies in relay. ${fullError}`))
        } else if (errorOutput.includes('EADDRINUSE')) {
          reject(new Error(`Port ${port} is already in use. ${fullError}`))
        } else {
          reject(new Error(fullError))
        }
      }
    })
  })
}

/**
 * Start relay with exponential backoff retry
 */
export async function startRelayWithRetry(
  config: RelayConfig,
  options: RetryOptions = {}
): Promise<ChildProcess> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | undefined
  
  logger.info(
    { 
      maxAttempts: opts.maxAttempts,
      timeoutMs: opts.timeoutMs,
      port: config.relayPort || 8000 
    },
    'relay.startup.begin'
  )

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      logger.info({ attempt, maxAttempts: opts.maxAttempts }, 'relay.startup.attempt')
      
      const process = await startRelayProcess(config, opts.timeoutMs)
      
      logger.info({ attempt }, 'relay.startup.success')
      return process
    } catch (error) {
      lastError = error as Error
      logger.error(
        { 
          attempt, 
          error: lastError.message,
          willRetry: attempt < opts.maxAttempts 
        },
        'relay.startup.failed'
      )

      // Don't retry on certain errors
      if (lastError.message.includes('not found at') || 
          lastError.message.includes('Node.js not found')) {
        break
      }

      // Calculate backoff and wait before retry
      if (attempt < opts.maxAttempts) {
        const delay = calculateBackoffDelay(attempt, opts)
        logger.info({ delay }, 'relay.startup.backoff')
        await sleep(delay)
      }
    }
  }

  // All attempts failed
  throw new RelayStartupError(
    `Failed to start relay after ${opts.maxAttempts} attempts`,
    opts.maxAttempts,
    lastError
  )
}

/**
 * Create a formatted error response for relay failures
 */
export function createRelayErrorResponse(error: Error): {
  error: string
  details: string
  troubleshooting?: string[]
} {
  const response = {
    error: 'Relay service unavailable',
    details: 'The calling service could not be started',
    troubleshooting: [] as string[],
  }

  if (error instanceof RelayStartupError) {
    response.details = `Failed after ${error.attempts} attempts: ${error.lastError?.message || error.message}`
    response.troubleshooting = [
      'Check that all Twilio/ElevenLabs credentials are configured',
      'Verify the relay port (default 8000) is not in use',
      'Check server logs for detailed error messages',
    ]
  } else if (error.message.includes('Missing dependencies')) {
    response.details = 'Relay dependencies not installed'
    response.troubleshooting = [
      'Run: npm install',
      'Ensure fastify and other relay dependencies are in package.json',
      'Check that node_modules is not in .gitignore for the relay',
    ]
  } else if (error.message.includes('EADDRINUSE')) {
    response.details = 'Relay port is already in use'
    response.troubleshooting = [
      'Check if another process is using port 8000',
      'Set a different port with RELAY_PORT environment variable',
      'Kill any existing relay processes',
    ]
  } else if (error.message.includes('not found at')) {
    response.details = 'Relay submodule not initialized'
    response.troubleshooting = [
      'Run: git submodule update --init --recursive',
      'Verify src/lib/productiv-ai-relay directory exists',
      'Check that the submodule was cloned correctly',
    ]
  }

  return response
}