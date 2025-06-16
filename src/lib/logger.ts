/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  context?: string
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, options?: LoggerOptions): string {
    const timestamp = new Date().toISOString()
    const context = options?.context ? `[${options.context}]` : ''
    return `${timestamp} [${level.toUpperCase()}]${context} ${message}`
  }

  private log(level: LogLevel, message: string, options?: LoggerOptions): void {
    const formattedMessage = this.formatMessage(level, message, options)
    const metadata = options?.metadata

    // In production, we might want to send logs to a service like Sentry or LogRocket
    if (this.isProduction) {
      // For now, we'll just use console in production too, but you can integrate
      // with your logging service here
      switch (level) {
        case 'error':
          console.error(formattedMessage, metadata)
          break
        case 'warn':
          console.warn(formattedMessage, metadata)
          break
        default:
          // In production, only log warnings and errors by default
          break
      }
    } else if (this.isDevelopment) {
      // In development, log everything
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, metadata)
          break
        case 'info':
          console.info(formattedMessage, metadata)
          break
        case 'warn':
          console.warn(formattedMessage, metadata)
          break
        case 'error':
          console.error(formattedMessage, metadata)
          break
      }
    }
  }

  debug(message: string, options?: LoggerOptions): void {
    this.log('debug', message, options)
  }

  info(message: string, options?: LoggerOptions): void {
    this.log('info', message, options)
  }

  warn(message: string, options?: LoggerOptions): void {
    this.log('warn', message, options)
  }

  error(message: string, error?: Error | unknown, options?: LoggerOptions): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    
    this.log('error', `${message}${error ? `: ${errorMessage}` : ''}`, {
      ...options,
      metadata: {
        ...options?.metadata,
        error: errorMessage,
        stack,
      },
    })
  }
}

// Create a singleton instance
const logger = new Logger()

export { logger }
export type { LogLevel, LoggerOptions }