import pino from 'pino'

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'

// Create logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  serializers: {
    error: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'auth',
      'secret',
      'apiKey',
      'api_key',
      'access_token',
      'refresh_token',
      'creditCard',
      'ssn',
    ],
    censor: '[REDACTED]',
  },
})

// Create child loggers for different modules
export const authLogger = logger.child({ module: 'auth' })
export const apiLogger = logger.child({ module: 'api' })
export const dbLogger = logger.child({ module: 'database' })
export const performanceLogger = logger.child({ module: 'performance' })
export const securityLogger = logger.child({ module: 'security' })

// Helper function to log API requests
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  error?: Error
) {
  const logData = {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
  }

  if (error) {
    apiLogger.error({ ...logData, error }, 'API request failed')
  } else if (statusCode >= 400) {
    apiLogger.warn(logData, 'API request completed with error status')
  } else {
    apiLogger.info(logData, 'API request completed')
  }
}

// Helper function to log performance metrics
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  performanceLogger.info(
    {
      operation,
      duration: `${duration}ms`,
      ...metadata,
    },
    'Performance metric'
  )
}

// Helper function to log security events
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: Record<string, any>
) {
  const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
  securityLogger[logMethod](
    {
      event,
      severity,
      ...details,
    },
    'Security event'
  )
}

export default logger
