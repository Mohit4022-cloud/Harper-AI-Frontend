import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  
  // Edge-specific settings
  transportOptions: {
    // Edge runtime doesn't support all Node.js APIs
    fetchOptions: {
      keepalive: true,
    },
  },
  
  // Before send hook
  beforeSend(event) {
    // Add edge context
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'edge',
      },
      edge: {
        region: process.env.VERCEL_REGION || 'unknown',
        runtime: 'edge',
      },
    }
    
    return event
  },
})

// Edge-specific error handling
export function captureEdgeError(
  error: Error,
  request: Request,
  context?: Record<string, any>
) {
  Sentry.captureException(error, {
    tags: {
      type: 'edge_error',
      url: request.url,
      method: request.method,
    },
    contexts: {
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      },
      custom: context,
    },
  })
}