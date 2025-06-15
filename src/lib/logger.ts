/**
 * Simplified Logger for Next.js Compatibility
 * Uses console-based logging to avoid worker thread issues
 */

import type { NextRequest } from 'next/server'

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Get log level from env (default to info)
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

// Log level priorities
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

// Current log level priority
const currentLevel = LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.info

// Color codes for terminal output (only in dev)
const colors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m'
}

// Format timestamp
function formatTime(): string {
  return new Date().toISOString()
}

// Simple logger class
class SimpleLogger {
  private context?: Record<string, any>

  constructor(context?: Record<string, any>) {
    this.context = context
  }

  private log(level: LogLevel, data: any, message?: string) {
    if (LOG_LEVELS[level] < currentLevel) return

    const timestamp = formatTime()
    const color = process.env.NODE_ENV === 'development' ? colors[level] : ''
    const reset = process.env.NODE_ENV === 'development' ? colors.reset : ''
    
    const prefix = `${color}[${timestamp}] ${level.toUpperCase()}${reset}`
    
    // Build log object
    const logObj: any = {
      timestamp,
      level: level.toUpperCase(),
      ...this.context
    }

    // Handle different input types
    if (typeof data === 'string') {
      logObj.message = data
    } else if (data instanceof Error) {
      logObj.error = {
        message: data.message,
        stack: data.stack,
        name: data.name
      }
      logObj.message = message || data.message
    } else {
      Object.assign(logObj, data)
      if (message) logObj.message = message
    }

    // Output based on environment
    if (process.env.NODE_ENV === 'development') {
      // Pretty print in development
      console.log(prefix, message || '')
      if (Object.keys(logObj).length > 3) {
        console.log(JSON.stringify(logObj, null, 2))
      }
    } else {
      // JSON in production
      console.log(JSON.stringify(logObj))
    }
  }

  debug(data: any, message?: string) {
    this.log('debug', data, message)
  }

  info(data: any, message?: string) {
    this.log('info', data, message)
  }

  warn(data: any, message?: string) {
    this.log('warn', data, message)
  }

  error(data: any, message?: string) {
    this.log('error', data, message)
  }

  child(context: Record<string, any>): SimpleLogger {
    return new SimpleLogger({ ...this.context, ...context })
  }
}

// Create base logger instance
export const logger = new SimpleLogger()

/**
 * Generate or extract request ID
 */
export function getRequestId(req: NextRequest): string {
  const existingId = req.headers.get('x-request-id')
  if (existingId) return existingId
  
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create a child logger for a specific request
 */
export function createRequestLogger(req: NextRequest) {
  const requestId = getRequestId(req)
  
  return logger.child({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent')
  })
}

/**
 * Log request details (sanitized)
 */
export function logRequest(req: NextRequest, body?: any) {
  const requestLogger = createRequestLogger(req)
  
  // Sanitize sensitive fields
  const sanitizedBody = body ? sanitizeObject(body) : undefined
  
  requestLogger.info({
    body: sanitizedBody,
    query: Object.fromEntries(new URL(req.url).searchParams)
  }, 'api.request')
  
  return requestLogger
}

/**
 * Log response details
 */
export function logResponse(
  logger: SimpleLogger,
  status: number,
  body?: any,
  error?: Error
) {
  const sanitizedBody = body ? sanitizeObject(body) : undefined
  
  if (error || status >= 500) {
    logger.error({
      status,
      body: sanitizedBody,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    }, 'api.response.error')
  } else if (status >= 400) {
    logger.warn({
      status,
      body: sanitizedBody
    }, 'api.response.client_error')
  } else {
    logger.info({
      status,
      body: process.env.NODE_ENV === 'development' ? sanitizedBody : undefined
    }, 'api.response.success')
  }
}

/**
 * Sanitize sensitive fields from objects
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  
  const sensitiveFields = [
    'password',
    'token',
    'authToken', 
    'twilioAuthToken',
    'elevenLabsKey',
    'apiKey',
    'api_key',
    'secret',
    'authorization'
  ]
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj }
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase()
    
    // Check if field name contains sensitive keywords
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }
  
  return sanitized
}

/**
 * Middleware wrapper for API routes
 * Automatically logs requests, responses, and errors
 */
export function withLogger<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    const requestLogger = createRequestLogger(req)
    const startTime = Date.now()
    
    try {
      // Log incoming request
      let body: any
      try {
        body = await req.clone().json()
      } catch {
        // Not JSON body or no body
      }
      
      logRequest(req, body)
      
      // Execute handler
      const response = await handler(req, ...args)
      
      // Log response
      const duration = Date.now() - startTime
      requestLogger.info({
        duration,
        status: response.status
      }, 'api.request.completed')
      
      return response
    } catch (error: any) {
      // Log error
      const duration = Date.now() - startTime
      requestLogger.error({
        duration,
        error: {
          message: error.message,
          stack: error.stack,
          ...error
        }
      }, 'api.request.failed')
      
      // Re-throw to let error handling middleware deal with it
      throw error
    }
  }) as T
}