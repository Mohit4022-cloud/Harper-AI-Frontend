import { NextRequest, NextResponse } from 'next/server'

// CSRF token generation and validation
const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE = 'csrf-token'
const TOKEN_LENGTH = 32

export function generateCSRFToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(TOKEN_LENGTH)
  if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(array)
  } else {
    // Fallback for older environments
    for (let i = 0; i < TOKEN_LENGTH; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function getCSRFToken(req: NextRequest): string | null {
  // Check header first, then cookie
  return req.headers.get(CSRF_HEADER) || req.cookies.get(CSRF_COOKIE)?.value || null
}

export function setCSRFCookie(res: NextResponse, token: string): void {
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export function validateCSRFToken(req: NextRequest, token: string): boolean {
  const requestToken = getCSRFToken(req)
  
  if (!requestToken || !token) {
    return false
  }
  
  // Simple comparison for Edge Runtime compatibility
  // In production, consider using a timing-safe comparison library
  return requestToken === token
}

// Middleware to check CSRF token for state-changing requests
export async function csrfProtection(req: NextRequest): Promise<NextResponse | null> {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return null
  }

  // Skip CSRF check for API routes that don't need it (like auth endpoints)
  const skipPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/csrf']
  if (skipPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return null
  }

  // Get CSRF token from cookie
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value

  if (!cookieToken) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    )
  }

  // Validate token
  if (!validateCSRFToken(req, cookieToken)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return null // Request is valid
}

// Helper hook for client-side CSRF token management
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    return { token: null, setToken: () => {} }
  }

  const getToken = () => {
    // Try to get from cookie
    const match = document.cookie.match(new RegExp('(^| )' + CSRF_COOKIE + '=([^;]+)'))
    return match ? match[2] : null
  }

  const setToken = (token: string) => {
    document.cookie = `${CSRF_COOKIE}=${token}; path=/; max-age=86400; samesite=strict${
      window.location.protocol === 'https:' ? '; secure' : ''
    }`
  }

  return { token: getToken(), setToken }
}