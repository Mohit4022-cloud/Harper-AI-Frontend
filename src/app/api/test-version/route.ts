import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: 'direct-relay',
    timestamp: new Date().toISOString(),
    message: 'This is the new code using direct relay functions'
  });
}