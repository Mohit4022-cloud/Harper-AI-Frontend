/**
 * Twilio Transcription Callback Handler
 * 
 * Handles transcription results from Twilio
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get form data from Twilio webhook
    const formData = await request.formData();
    const transcriptionSid = formData.get('TranscriptionSid') as string;
    const transcriptionText = formData.get('TranscriptionText') as string;
    const transcriptionStatus = formData.get('TranscriptionStatus') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('[Twilio Transcription Callback] Transcription update:', {
      transcriptionSid,
      transcriptionStatus,
      recordingSid,
      callSid,
      textLength: transcriptionText?.length || 0,
    });

    if (transcriptionStatus === 'completed' && transcriptionText) {
      // In a real app, you would:
      // 1. Store the transcription in your database
      // 2. Update the call record with the transcription
      // 3. Trigger AI analysis (sentiment, coaching, etc.)

      const transcriptionData = {
        sid: transcriptionSid,
        text: transcriptionText,
        recordingSid,
        callSid,
        status: transcriptionStatus,
      };

      // Log for demo purposes
      console.log('[Twilio Transcription Callback] Transcription completed:', {
        ...transcriptionData,
        preview: transcriptionText.substring(0, 100) + '...',
      });

      // You could trigger AI analysis here
      // await analyzeTranscript(transcriptionText, callSid);
    } else if (transcriptionStatus === 'failed') {
      console.error('[Twilio Transcription Callback] Transcription failed for recording:', recordingSid);
    }

    // Send success response to Twilio
    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('[Twilio Transcription Callback] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio Transcription Callback is ready',
    endpoint: '/api/twilio/transcription',
    method: 'POST',
  });
}