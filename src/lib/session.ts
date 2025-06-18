import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { verifyToken } from '@/lib/jwt';

/**
 * Session configuration with 30-minute inactivity timeout
 */
export const sessionConfig = {
  cookieName: 'harper-ai-session',
  secure: env.server.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict' as const,
  // 30 minutes inactivity timeout
  maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
  rolling: true, // Reset timer on each request
};

/**
 * Refresh session cookie on each authenticated request
 * This implements rolling sessions - the session timeout resets with each activity
 */
export function refreshSessionCookie(response: NextResponse, token: string): NextResponse {
  // Set the session cookie with updated expiry
  response.cookies.set(sessionConfig.cookieName, token, {
    httpOnly: sessionConfig.httpOnly,
    secure: sessionConfig.secure,
    sameSite: sessionConfig.sameSite,
    maxAge: sessionConfig.maxAge / 1000, // Convert to seconds for cookie
    path: '/',
  });

  // Also set a client-readable last activity timestamp
  response.cookies.set('harper-ai-last-activity', Date.now().toString(), {
    httpOnly: false, // Allow client to read this
    secure: sessionConfig.secure,
    sameSite: sessionConfig.sameSite,
    maxAge: sessionConfig.maxAge / 1000,
    path: '/',
  });

  return response;
}

/**
 * Middleware to handle session refresh on authenticated requests
 */
export async function withSessionRefresh(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const response = await handler(request);
  
  // Check if request has valid authentication
  const token = request.cookies.get(sessionConfig.cookieName)?.value;
  
  if (token) {
    try {
      // Verify the token is still valid
      const decoded = await verifyToken(token);
      
      if (decoded) {
        // Refresh the session cookie
        return refreshSessionCookie(response, token);
      }
    } catch (error) {
      // Token is invalid, don't refresh
      console.error('Session refresh error:', error);
    }
  }
  
  return response;
}

/**
 * Client-side session activity tracker
 * Call this on user interactions to keep session alive
 */
export function updateSessionActivity() {
  if (typeof window !== 'undefined') {
    // Update local storage with last activity
    localStorage.setItem('harper-ai-last-activity', Date.now().toString());
    
    // Ping the server to refresh server-side session
    fetch('/api/auth/refresh-session', {
      method: 'POST',
      credentials: 'include',
    }).catch(error => {
      console.error('Failed to refresh session:', error);
    });
  }
}

/**
 * Check if session is about to expire (within 5 minutes)
 */
export function isSessionExpiringSoon(): boolean {
  if (typeof window === 'undefined') return false;
  
  const lastActivity = localStorage.getItem('harper-ai-last-activity');
  if (!lastActivity) return true;
  
  const timeSinceActivity = Date.now() - parseInt(lastActivity);
  const fiveMinutes = 5 * 60 * 1000;
  
  return timeSinceActivity > (sessionConfig.maxAge - fiveMinutes);
}

/**
 * Get remaining session time in milliseconds
 */
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') return 0;
  
  const lastActivity = localStorage.getItem('harper-ai-last-activity');
  if (!lastActivity) return 0;
  
  const timeSinceActivity = Date.now() - parseInt(lastActivity);
  const remaining = sessionConfig.maxAge - timeSinceActivity;
  
  return Math.max(0, remaining);
}