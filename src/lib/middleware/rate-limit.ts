import { NextRequest, NextResponse } from 'next/server'

// In-memory store for rate limiting (consider using Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000
)

export interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  max?: number // Maximum requests per window
  message?: string // Error message
  skipSuccessfulRequests?: boolean // Skip counting successful requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = options

  const key = keyGenerator(req)
  const now = Date.now()
  const resetTime = now + windowMs

  // Get current rate limit info
  let rateLimitInfo = rateLimitStore.get(key)

  if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
    // Create new rate limit window
    rateLimitInfo = { count: 0, resetTime }
    rateLimitStore.set(key, rateLimitInfo)
  }

  // Increment request count
  if (!skipSuccessfulRequests) {
    rateLimitInfo.count++
  }

  // Check if limit exceeded
  if (rateLimitInfo.count > max) {
    const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000)

    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    )
  }

  // Add rate limit headers to successful responses
  const remaining = Math.max(0, max - rateLimitInfo.count)
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', max.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitInfo.resetTime).toISOString())

  return null // Continue to next middleware
}

// Default key generator using IP address
function defaultKeyGenerator(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')

  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'
  const pathname = req.nextUrl.pathname

  // Create key based on IP and path
  return `${ip}:${pathname}`
}

// Specific rate limiters for different endpoints
export const authRateLimit = (req: NextRequest) =>
  rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later.',
  })

export const apiRateLimit = (req: NextRequest) =>
  rateLimit(req, {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per window
  })

export const uploadRateLimit = (req: NextRequest) =>
  rateLimit(req, {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Upload limit exceeded, please try again later.',
  })
