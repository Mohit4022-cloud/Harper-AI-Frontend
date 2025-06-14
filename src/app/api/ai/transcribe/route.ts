/**
 * AI-Powered Transcription API Route
 * 
 * Handles audio transcription with speaker diarization and sentiment analysis
 * Currently returns mock data for development/testing
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TranscriptSegment } from '@/types/transcript';

/**
 * Mock transcription function for development
 * Returns realistic transcript segments with sentiment analysis
 */
async function mockTranscribe(audioUrl: string): Promise<TranscriptSegment[]> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return mock transcript segments with timestamps in milliseconds
  return [
    {
      speaker: 'agent',
      text: "Hi, this is John from Harper AI. I'm calling to discuss how we can help improve your sales team's productivity.",
      startTime: 0,
      endTime: 5000,
      sentiment: {
        score: 0.8,
        magnitude: 0.7,
        label: 'positive',
      }
    },
    {
      speaker: 'customer',
      text: "Oh, hi John. We're actually looking at solutions for our SDR team. What makes Harper AI different?",
      startTime: 5000,
      endTime: 10000,
      sentiment: {
        score: 0.6,
        magnitude: 0.5,
        label: 'positive',
      }
    },
    {
      speaker: 'agent',
      text: "Great question! Harper AI uses real-time AI coaching to help SDRs improve during calls, not just after. We provide live sentiment analysis and conversation insights.",
      startTime: 10000,
      endTime: 17000,
      sentiment: {
        score: 0.9,
        magnitude: 0.8,
        label: 'positive',
      }
    },
    {
      speaker: 'customer',
      text: "That sounds interesting. How accurate is the sentiment analysis? And does it work with our existing phone system?",
      startTime: 17000,
      endTime: 22000,
      sentiment: {
        score: 0.5,
        magnitude: 0.6,
        label: 'positive',
      }
    },
    {
      speaker: 'agent',
      text: "Our sentiment analysis is over 90% accurate and continuously improves. We integrate with most major phone systems including RingCentral, Aircall, and Twilio. The setup usually takes less than 30 minutes.",
      startTime: 22000,
      endTime: 30000,
      sentiment: {
        score: 0.85,
        magnitude: 0.75,
        label: 'positive',
      }
    },
    {
      speaker: 'customer',
      text: "What about pricing? We have a team of 15 SDRs.",
      startTime: 30000,
      endTime: 33000,
      sentiment: {
        score: 0.3,
        magnitude: 0.4,
        label: 'neutral',
      }
    },
    {
      speaker: 'agent',
      text: "For a team of 15, we offer volume pricing that typically comes out to less than the cost of one lost deal per month. I'd be happy to put together a custom quote. Would you be interested in seeing a quick demo first?",
      startTime: 33000,
      endTime: 41000,
      sentiment: {
        score: 0.75,
        magnitude: 0.7,
        label: 'positive',
      }
    }
  ];
}

/**
 * POST /api/ai/transcribe
 * 
 * Transcribes audio and returns segments with sentiment analysis
 * 
 * Request body:
 * - audioUrl: URL of the audio file to transcribe
 * - config: Optional configuration (model, language, etc.)
 * 
 * @returns Transcript segments with speaker identification and sentiment
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { audioUrl, config } = body;

    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 });
    }

    // In development or if OpenAI is not configured, use mock transcription
    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'development') {
      const segments = await mockTranscribe(audioUrl);
      return NextResponse.json({ 
        segments,
        metadata: {
          duration: 41000,
          language: config?.language || 'en-US',
          confidence: 0.95
        }
      });
    }

    // Production implementation would go here:
    // 1. Download audio from URL
    // 2. Send to OpenAI Whisper API
    // 3. Process response with speaker diarization
    // 4. Add sentiment analysis
    // 5. Return formatted segments

    // For now, return mock data
    const segments = await mockTranscribe(audioUrl);
    return NextResponse.json({ 
      segments,
      metadata: {
        duration: 41000,
        language: config?.language || 'en-US',
        confidence: 0.95
      }
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/transcribe
 * 
 * Returns sample transcript data for testing
 */
export async function GET(request: NextRequest) {
  const segments = await mockTranscribe('sample');
  return NextResponse.json({
    segments,
    metadata: {
      duration: 41000,
      language: 'en-US',
      confidence: 0.95
    }
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}