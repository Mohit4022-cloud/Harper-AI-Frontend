/**
 * Structured Logger Configuration
 * Uses Pino for high-performance JSON logging with request tracking
 */

import pino from 'pino'
import type { NextRequest } from 'next/server'

// Configure log level from env (default to info)
const level = process.env.LOG_LEVEL || 'info'

// Create base logger instance
export const logger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label.toUpperCase() }
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  // Pretty print in development
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }),
})

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
    userAgent: req.headers.get('user-agent'),
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
    query: Object.fromEntries(new URL(req.url).searchParams),
  }, 'api.request')
  
  return requestLogger
}

/**
 * Log response details
 */
export function logResponse(
  logger: pino.Logger,
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
        name: error.name,
      } : undefined,
    }, 'api.response.error')
  } else if (status >= 400) {
    logger.warn({
      status,
      body: sanitizedBody,
    }, 'api.response.client_error')
  } else {
    logger.info({
      status,
      body: process.env.NODE_ENV === 'development' ? sanitizedBody : undefined,
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
    'authorization',
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
        status: response.status,
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
          ...error,
        },
      }, 'api.request.failed')
      
      // Re-throw to let error handling middleware deal with it
      throw error
    }
  }) as T
}