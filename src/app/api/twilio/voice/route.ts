/**
 * Twilio Voice Webhook Handler
 * 
 * Handles incoming voice calls and generates TwiML responses
 * This endpoint is called by Twilio when making outbound calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConfig, TWILIO_VOICE_SETTINGS } from '@/config/twilio';

export async function POST(request: NextRequest) {
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const callStatus = formData.get('CallStatus') as string;
    const direction = formData.get('Direction') as string;

    console.log('[Twilio Voice Webhook] Received call:', {
      callSid,
      from,
      to,
      callStatus,
      direction,
    });

    // Get Twilio configuration
    const twilioConfig = getTwilioConfig();
    if (!twilioConfig) {
      return new NextResponse('Twilio not configured', { status: 503 });
    }

    // Generate TwiML response
    const twiml = generateTwiML({
      to,
      from,
      enableRecording: true,
      enableTranscription: true,
    });

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('[Twilio Voice Webhook] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Generate TwiML for outbound calls
 */
function generateTwiML(options: {
  to: string;
  from: string;
  enableRecording?: boolean;
  enableTranscription?: boolean;
}): string {
  const { to, from, enableRecording, enableTranscription } = options;

  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';

  // Start recording if enabled
  if (enableRecording) {
    twiml += `<Record 
      recordingStatusCallback="/api/twilio/recording" 
      recordingStatusCallbackMethod="POST"
      recordingStatusCallbackEvent="completed"
      transcribe="${enableTranscription}"
      transcribeCallback="/api/twilio/transcription"
      maxLength="3600"
      timeout="10"
      playBeep="false"
    />`;
  }

  // For demo purposes, play a greeting and connect the call
  twiml += `
    <Say voice="${TWILIO_VOICE_SETTINGS.voice}" language="${TWILIO_VOICE_SETTINGS.language}">
      Hello, this is Harper AI connecting your call.
    </Say>
  `;

  // Dial the destination number
  twiml += `
    <Dial 
      callerId="${from}"
      timeout="30"
      action="/api/twilio/status"
      method="POST"
    >
      <Number statusCallback="/api/twilio/status" statusCallbackMethod="POST">
        ${to}
      </Number>
    </Dial>
  `;

  twiml += '</Response>';

  return twiml;
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio Voice Webhook is ready',
    endpoint: '/api/twilio/voice',
    method: 'POST',
  });
}