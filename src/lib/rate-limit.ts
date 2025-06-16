import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for Next.js API routes
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs?: number // Time window in milliseconds
  max?: number // Max requests per window
  message?: string // Error message
  keyGenerator?: (req: NextRequest) => string // Function to generate key
}

export function createRateLimiter(config: RateLimitConfig = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Use IP address as default key
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return ip
    }
  } = config

  return async function rateLimit(req: NextRequest) {
    const key = keyGenerator(req)
    const now = Date.now()
    const resetTime = now + windowMs

    if (!store[key]) {
      store[key] = { count: 1, resetTime }
      return null // Allow request
    }

    if (store[key].resetTime < now) {
      // Window has expired, reset
      store[key] = { count: 1, resetTime }
      return null // Allow request
    }

    if (store[key].count >= max) {
      // Rate limit exceeded
      return NextResponse.json(
        { error: message },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((store[key].resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString(),
          }
        }
      )
    }

    // Increment count
    store[key].count++
    return null // Allow request
  }
}

// Pre-configured rate limiters for different use cases
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
})

export const apiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'API rate limit exceeded, please try again later.',
})

export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded, please try again later.',
})