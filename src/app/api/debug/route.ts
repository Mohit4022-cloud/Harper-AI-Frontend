/**
 * Debug endpoint to verify deployment status
 * This can be removed after confirming deployment
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Harper AI API Debug Endpoint",
    deployedAt: new Date().toISOString(),
    lastCommit: "193ff533 - fix: Replace calls API with standards-compliant Next.js 15 implementation",
    environment: process.env.NODE_ENV,
    apiVersion: "2.0.0",
    features: {
      callsAPI: {
        collection: "/api/calls",
        individual: "/api/calls/[id]",
        validation: "Zod",
        pagination: true,
        filtering: true,
        sorting: true
      }
    },
    timestamp: Date.now()
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}