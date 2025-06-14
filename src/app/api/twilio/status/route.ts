/**
 * Twilio Status Callback Handler
 * 
 * Handles call status updates from Twilio
 * Updates call records with status changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateCall } from '@/lib/callService';
import { TWILIO_CALL_STATUS, type TwilioCallStatus } from '@/config/twilio';

export async function POST(request: NextRequest) {
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as TwilioCallStatus;
    const duration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;
    const timestamp = formData.get('Timestamp') as string;

    console.log('[Twilio Status Callback] Call status update:', {
      callSid,
      callStatus,
      duration,
      from,
      to,
      direction,
      timestamp,
    });

    // Map Twilio status to our internal status
    let internalStatus: 'completed' | 'failed' | 'no-answer' | 'busy' = 'completed';
    
    switch (callStatus) {
      case TWILIO_CALL_STATUS.COMPLETED:
        internalStatus = 'completed';
        break;
      case TWILIO_CALL_STATUS.FAILED:
      case TWILIO_CALL_STATUS.CANCELED:
        internalStatus = 'failed';
        break;
      case TWILIO_CALL_STATUS.NO_ANSWER:
        internalStatus = 'no-answer';
        break;
      case TWILIO_CALL_STATUS.BUSY:
        internalStatus = 'busy';
        break;
    }

    // Update call record in our database
    // In a real app, you would look up the call by Twilio SID
    // For now, we'll just log the update
    console.log('[Twilio Status Callback] Would update call:', {
      twilioSid: callSid,
      status: internalStatus,
      duration: parseInt(duration) || 0,
    });

    // Send success response to Twilio
    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('[Twilio Status Callback] Error:', error);
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
    statuses: Object.values(TWILIO_CALL_STATUS),
  });
}