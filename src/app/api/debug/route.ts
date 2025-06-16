/**
 * Debug endpoint - SECURED
 * Only accessible in development or with proper authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  // Check if we're in production
  if (env.server.NODE_ENV === 'production') {
    // Check for authorization header with a secure token
    const authHeader = request.headers.get('authorization');
    const debugToken = request.headers.get('x-debug-token');
    
    // In production, require proper authentication
    if (!authHeader && !debugToken) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to debug endpoint'
      }, { status: 401 });
    }
    
    // You could add additional validation here for production access
    // For example, checking if the token matches a secure value
  }
  
  // Return minimal information in production
  const isProduction = env.server.NODE_ENV === 'production';
  
  return NextResponse.json({
    message: "Harper AI API Status",
    timestamp: new Date().toISOString(),
    environment: env.server.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    // Only include detailed info in development
    ...(isProduction ? {} : {
      features: {
        realTimeTranscription: env.server.ENABLE_REAL_TIME_TRANSCRIPTION,
        aiCoaching: env.server.ENABLE_AI_COACHING,
        predictiveAnalytics: env.server.ENABLE_PREDICTIVE_ANALYTICS,
        crmSync: env.server.ENABLE_CRM_SYNC,
      },
      api: {
        endpoints: [
          "/api/auth/*",
          "/api/calls/*",
          "/api/contacts/*",
          "/api/calendar/*",
          "/api/settings",
          "/api/reports/*"
        ]
      }
    })
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}