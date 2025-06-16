import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { csrfProtection } from '@/lib/csrf';

// CORS configuration with enhanced security
const ALLOWED_ORIGINS = {
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ],
  production: [
    'https://harper-ai-frontend.onrender.com',
    'https://harper-ai-frontend-2.onrender.com',
    'https://harper-ai-advanced-features.onrender.com'
  ]
};

const CORS_HEADERS = {
  methods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  headers: 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Api-Version',
  credentials: 'true',
  maxAge: '86400' // 24 hours
};

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': process.env.NODE_ENV === 'production' 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:;"
};

export async function middleware(request: NextRequest) {
  // Skip middleware for static assets
  if (request.nextUrl.pathname.startsWith('/_next/') || 
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    try {
      // Apply rate limiting
      if (request.nextUrl.pathname.startsWith('/api/auth')) {
        const rateLimitResponse = await authRateLimit(request);
        if (rateLimitResponse) return rateLimitResponse;
      } else {
        const rateLimitResponse = await apiRateLimit(request);
        if (rateLimitResponse) return rateLimitResponse;
      }

      // Apply CSRF protection
      const csrfResponse = await csrfProtection(request);
      if (csrfResponse) return csrfResponse;

      const response = NextResponse.next();
      const origin = request.headers.get('origin');
      const isDevMode = process.env.NODE_ENV === 'development';
      
      // Get allowed origins based on environment
      const allowedOrigins = isDevMode 
        ? ALLOWED_ORIGINS.development 
        : ALLOWED_ORIGINS.production;
      
      // Check origin and set CORS headers
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (isDevMode && origin?.startsWith('http://localhost:')) {
        // In development, allow any localhost origin
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (!origin || origin === request.nextUrl.origin) {
        // Same-origin request
        response.headers.set('Access-Control-Allow-Origin', request.nextUrl.origin);
      }
      
      // Set CORS headers
      response.headers.set('Access-Control-Allow-Methods', CORS_HEADERS.methods);
      response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS.headers);
      response.headers.set('Access-Control-Allow-Credentials', CORS_HEADERS.credentials);
      response.headers.set('Access-Control-Max-Age', CORS_HEADERS.maxAge);
      
      // Set security headers
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { 
          status: 200, 
          headers: response.headers 
        });
      }
      
      return response;
    } catch (error) {
      console.error('[Middleware] Error:', error);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Internal server error',
          statusCode: 500 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // Handle health check endpoint
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.json({
      success: true,
      message: 'Harper AI API is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    });
  }

  // For non-API routes, add security headers
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};