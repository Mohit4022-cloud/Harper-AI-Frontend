import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for performance metrics
const performanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  id: z.string(),
  delta: z.number().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  timestamp: z.number(),
  url: z.string(),
  userAgent: z.string(),
})

const batchSchema = z.array(performanceMetricSchema)

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }
  
  userLimit.count++
  return true
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW)

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString()
          }
        }
      )
    }
    
    const body = await request.json()
    
    // Validate batch data
    const metrics = batchSchema.parse(body)
    
    // Process metrics (in production, save to database)
    // Here we're just logging them
    console.log(`Received batch of ${metrics.length} metrics from ${ip}`)
    
    // You can add your metric processing logic here
    // For example, save to database, send to analytics service, etc.
    
    return NextResponse.json({ 
      success: true, 
      processed: metrics.length 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid metric data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Failed to process performance metrics batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}