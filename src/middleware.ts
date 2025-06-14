import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CORS configuration with enhanced security and error handling
const ALLOWED_ORIGINS = {
  development: ['http://localhost:3000', 'http://localhost:3001'],
  production: [
    'https://harper-ai-frontend.onrender.com',
    'https://harper-ai-frontend-1.onrender.com',
    'https://harper-ai-advanced-features.onrender.com'
  ]
};

const CORS_HEADERS = {
  methods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  headers: 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Api-Version',
  credentials: 'true',
  maxAge: '86400' // 24 hours
};

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    try {
      const response = NextResponse.next();
      const origin = request.headers.get('origin');
      const isDevMode = process.env.NODE_ENV === 'development';
      
      // Get allowed origins based on environment
      const allowedOrigins = isDevMode 
        ? ALLOWED_ORIGINS.development 
        : ALLOWED_ORIGINS.production;
      
      // In development, also allow any localhost origin
      if (isDevMode && origin?.startsWith('http://localhost:')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (!origin && isDevMode) {
        // Allow same-origin requests in development
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      // Set CORS headers
      response.headers.set('Access-Control-Allow-Methods', CORS_HEADERS.methods);
      response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS.headers);
      response.headers.set('Access-Control-Allow-Credentials', CORS_HEADERS.credentials);
      response.headers.set('Access-Control-Max-Age', CORS_HEADERS.maxAge);
      
      // Security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        console.log('[CORS] Handling preflight request from:', origin || 'no-origin');
        return new Response(null, { 
          status: 200, 
          headers: response.headers 
        });
      }
      
      // Log CORS handling in development
      if (isDevMode) {
        console.log('[CORS] Request from:', origin || 'same-origin', 'to:', request.url);
      }
      
      return response;
    } catch (error) {
      console.error('[CORS] Middleware error:', error);
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'CORS configuration error',
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
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};