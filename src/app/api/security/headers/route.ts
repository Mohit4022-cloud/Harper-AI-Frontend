import { NextRequest, NextResponse } from 'next/server'

const REQUIRED_HEADERS = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'Referrer-Policy',
  'Permissions-Policy',
]

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || request.headers.get('referer') || '/'
  
  try {
    const response = await fetch(new URL(url, request.url), {
      method: 'HEAD',
    })

    const headers: Record<string, string> = {}
    const missing: string[] = []
    
    REQUIRED_HEADERS.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        headers[header] = value
      } else {
        missing.push(header)
      }
    })

    const score = ((REQUIRED_HEADERS.length - missing.length) / REQUIRED_HEADERS.length) * 100

    return NextResponse.json({
      score: Math.round(score),
      headers,
      missing,
      recommendation: score === 100 
        ? 'All security headers are properly configured' 
        : `Missing ${missing.length} security headers`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check headers' },
      { status: 500 }
    )
  }
}