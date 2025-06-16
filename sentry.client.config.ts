import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out browser extension errors
    if (event.exception?.values?.[0]?.value?.includes('inpage.js')) {
      return null
    }
    
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event, hint)
      return null
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