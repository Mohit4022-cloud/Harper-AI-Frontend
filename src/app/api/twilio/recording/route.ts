/**
 * Twilio Recording Callback Handler
 * 
 * Handles recording status updates and stores recording URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { TWILIO_RECORDING_STATUS, type TwilioRecordingStatus } from '@/config/twilio';

export async function POST(request: NextRequest) {
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as TwilioRecordingStatus;
    const recordingDuration = formData.get('RecordingDuration') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('[Twilio Recording Callback] Recording update:', {
      recordingSid,
      recordingUrl,
      recordingStatus,
      recordingDuration,
      callSid,
    });

    // Handle recording based on status
    if (recordingStatus === TWILIO_RECORDING_STATUS.COMPLETED) {
      // In a real app, you would:
      // 1. Download the recording from Twilio
      // 2. Store it in your own storage (S3, etc.)
      // 3. Update the call record with the recording URL
      // 4. Trigger transcription if needed

      const recordingData = {
        sid: recordingSid,
        url: recordingUrl,
        duration: parseInt(recordingDuration) || 0,
        callSid,
        status: recordingStatus,
      };

      // Log for demo purposes
      console.log('[Twilio Recording Callback] Recording completed:', recordingData);

      // You could trigger transcription here
      // await triggerTranscription(recordingUrl, callSid);
    } else if (recordingStatus === TWILIO_RECORDING_STATUS.FAILED) {
      console.error('[Twilio Recording Callback] Recording failed for call:', callSid);
    }

    // Send success response to Twilio
    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('[Twilio Recording Callback] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio Recording Callback is ready',
    endpoint: '/api/twilio/recording',
    method: 'POST',
    statuses: Object.values(TWILIO_RECORDING_STATUS),
  });
}