import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next();
    
    // Allow requests from any origin in development, specific origins in production
    const allowedOrigins = process.env.NODE_ENV === 'development' 
      ? ['*'] 
      : [
          'https://harper-ai-frontend.onrender.com',
          'https://harper-ai-frontend-1.onrender.com',
          'https://harper-ai-advanced-features.onrender.com',
          'http://localhost:3000',
          'http://localhost:3001'
        ];
    
    const origin = request.headers.get('origin');
    
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};