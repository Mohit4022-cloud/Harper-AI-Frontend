import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracingOrigins: ['localhost', process.env.NEXT_PUBLIC_APP_URL, /^\//],
      // Track interactions
      routingInstrumentation: Sentry.nextRouterInstrumentation,
    }),
    new Sentry.Replay({
      // Mask all text content, but keep media playback
      maskAllText: true,
      blockAllMedia: false,
      // Sampling rates
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
    }),
  ],
  
  // Filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // User cancelled requests
    'AbortError',
    // Benign browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Other browser extensions
    /^moz-extension:\/\//i,
    /^ms-browser-extension:\/\//i,
  ],
  
  // Before send hook
  beforeSend(event, hint) {
    // Filter out non-app errors
    if (event.exception) {
      const error = hint.originalException
      
      // Don't send errors from browser extensions
      if (error && error.stack && error.stack.match(/chrome-extension:|moz-extension:|ms-browser-extension:/)) {
        return null
      }
      
      // Add user context
      const user = getUserContext()
      if (user) {
        event.user = {
          id: user.id,
          email: user.email,
          username: user.name,
        }
      }
      
      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          version: process.env.NEXT_PUBLIC_APP_VERSION,
          feature_flags: getFeatureFlags(),
        },
      }
    }
    
    return event
  },
  
  // Breadcrumb filtering
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null
    }
    
    // Add more context to navigation breadcrumbs
    if (breadcrumb.category === 'navigation') {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
      }
    }
    
    return breadcrumb
  },
})

// Helper functions
function getUserContext() {
  // Get user from your auth system
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

function getFeatureFlags() {
  // Get feature flags from your feature flag system
  return {
    websocket_enabled: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
    new_ui: process.env.NEXT_PUBLIC_NEW_UI === 'true',
  }
}

// Export for use in app
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

export function setUser(user: { id: string; email: string; name: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    })
  } else {
    Sentry.setUser(null)
  }
}