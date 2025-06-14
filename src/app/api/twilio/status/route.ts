/**
 * Twilio Status Callback Handler
 * 
 * Handles call status updates from Twilio
 * Uses direct relay functions to update call state
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleCallStatus } from '@/services/callRelayDirect';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9);
  
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const duration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;
    const timestamp = formData.get('Timestamp') as string;

    logger.info({
      requestId,
      callSid,
      callStatus,
      duration,
      from,
      to,
      direction,
      timestamp,
    }, 'twilio.status.update');

    // Update call status using direct relay function
    await handleCallStatus({
      CallSid: callSid,
      CallStatus: callStatus,
      Duration: duration,
      requestId
    });

    // Send success response to Twilio
    return new NextResponse('', { status: 200 });
  } catch (error: any) {
    logger.error({ 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'twilio.status.error');
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio Status Callback is ready',
    endpoint: '/api/twilio/status',
    method: 'POST',
    statuses: ['initiated', 'ringing', 'answered', 'completed', 'busy', 'no-answer', 'failed', 'canceled'],
  });
}