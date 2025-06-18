import { NextRequest, NextResponse } from 'next/server';
import { sessionConfig } from '@/lib/session';
import { verifyToken } from '@/lib/jwt';

/**
 * Middleware to handle rolling session updates
 * Refreshes session cookie on each authenticated request
 */
export async function sessionMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Skip session refresh for auth endpoints
  const skipPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/logout'];
  if (skipPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return response;
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get(sessionConfig.cookieName)?.value;
  
  if (sessionToken) {
    try {
      // Verify token is still valid
      const decoded = await verifyToken(sessionToken);
      
      if (decoded) {
        // Refresh the session cookie with new expiry (rolling session)
        response.cookies.set(sessionConfig.cookieName, sessionToken, {
          httpOnly: sessionConfig.httpOnly,
          secure: sessionConfig.secure,
          sameSite: sessionConfig.sameSite,
          maxAge: sessionConfig.maxAge / 1000, // Convert to seconds
          path: '/',
        });

        // Update last activity timestamp
        response.cookies.set('harper-ai-last-activity', Date.now().toString(), {
          httpOnly: false,
          secure: sessionConfig.secure,
          sameSite: sessionConfig.sameSite,
          maxAge: sessionConfig.maxAge / 1000,
          path: '/',
        });
      }
    } catch (error) {
      // Token is invalid, don't refresh
      console.error('Session middleware error:', error);
    }
  }

  return response;
}