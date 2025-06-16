import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [],
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event, hint)
      return null
    }
    
    // Filter out specific errors
    const error = hint.originalException
    if (error && error instanceof Error) {
      // Filter out JWT errors in development
      if (error.message.includes('JWT_SECRET environment variable is required')) {
        return null
      }
    }
    
    return event
  },
  
  // Configure tracing
  beforeSendTransaction(transaction) {
    // Filter out health check transactions
    if (transaction.transaction === '/api/health') {
      return null
    }
    
    return transaction
  },
})