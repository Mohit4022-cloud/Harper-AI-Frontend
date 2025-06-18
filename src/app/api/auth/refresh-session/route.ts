import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { refreshSessionCookie, sessionConfig } from '@/lib/session';

/**
 * POST /api/auth/refresh-session
 * Endpoint to refresh session cookie on user activity
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session token from cookies
    const token = request.cookies.get(sessionConfig.cookieName)?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Verify the token is still valid
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Create response and refresh the session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed',
      expiresAt: new Date(Date.now() + sessionConfig.maxAge).toISOString(),
    });

    // Refresh the session cookie with new expiry
    return refreshSessionCookie(response, token);
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
}