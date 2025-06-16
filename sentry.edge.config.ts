import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event, hint)
      return null
    }
    
    return event
  },
})