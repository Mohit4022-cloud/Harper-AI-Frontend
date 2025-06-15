import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  
  // Server-specific settings
  autoSessionTracking: true,
  
  // Integrations
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  
  // Filtering
  ignoreErrors: [
    // Known Next.js errors
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    // API errors
    'ERR_BAD_REQUEST',
    'ERR_UNAUTHORIZED',
  ],
  
  // Before send hook
  beforeSend(event, hint) {
    // Add server context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'node',
        version: process.version,
      },
      server: {
        host: process.env.HOSTNAME || 'unknown',
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'unknown',
      },
    }
    
    // Filter out expected errors
    if (event.exception) {
      const error = hint.originalException as Error
      
      // Don't report client errors that made it to the server
      if (error?.message?.includes('NEXT_NOT_FOUND')) {
        return null
      }
      
      // Add request context for API errors
      if (hint.originalException && 'statusCode' in hint.originalException) {
        event.tags = {
          ...event.tags,
          http_status_code: (hint.originalException as any).statusCode,
        }
      }
    }
    
    return event
  },
  
  // Server-side profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})

// Enhanced error capture for server-side
export function captureApiError(
  error: Error,
  req: {
    method?: string
    url?: string
    headers?: Record<string, string>
    query?: Record<string, string>
    body?: any
  },
  statusCode?: number
) {
  Sentry.captureException(error, {
    tags: {
      type: 'api_error',
      status_code: statusCode,
    },
    contexts: {
      request: {
        method: req.method,
        url: req.url,
        query_string: JSON.stringify(req.query),
        headers: req.headers,
        data: req.body,
      },
    },
  })
}

// Performance monitoring helper
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}

// Database query monitoring
export function captureDbQuery(query: string, duration: number, error?: Error) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
  
  if (transaction) {
    const span = transaction.startChild({
      op: 'db.query',
      description: query,
    })
    
    if (error) {
      span.setStatus('internal_error')
      Sentry.captureException(error, {
        tags: { type: 'db_error' },
        contexts: { query: { sql: query } },
      })
    } else {
      span.setStatus('ok')
    }
    
    span.finish()
  }
}

// WebSocket error handling
export function captureWsError(error: Error, context: {
  event?: string
  userId?: string
  room?: string
}) {
  Sentry.captureException(error, {
    tags: {
      type: 'websocket_error',
      event: context.event,
    },
    contexts: {
      websocket: context,
    },
  })
}