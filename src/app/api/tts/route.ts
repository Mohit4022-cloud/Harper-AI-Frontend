import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export async function POST(req: NextRequest) {
  try {
    const { text, voiceSettings } = await req.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Get settings from in-memory store
    const settingsModule = await import('@/app/api/settings/route')
    const settingsResponse = await settingsModule.GET(req)
    
    const settingsData = await settingsResponse.json()
    const settings = settingsData.data?.integrations
    
    const apiKey = settings?.elevenLabsKey || process.env.ELEVENLABS_API_KEY
    const voiceId = settings?.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM' // Rachel voice

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Generate speech with ElevenLabs
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      )
    }

    // Stream the audio response
    const audioStream = response.body
    if (!audioStream) {
      return NextResponse.json(
        { error: 'No audio stream received' },
        { status: 500 }
      )
    }

    // Return the audio stream with proper headers
    return new NextResponse(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate speech', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if TTS is configured
export async function GET() {
  // Get settings from in-memory store
  const settingsModule = await import('@/app/api/settings/route')
  const dummyReq = { headers: new Headers() } as any
  const settingsResponse = await settingsModule.GET(dummyReq)
  
  const settingsData = await settingsResponse.json()
  const settings = settingsData.data?.integrations
  
  const isConfigured = !!(
    (settings?.elevenLabsKey || process.env.ELEVENLABS_API_KEY) && 
    (settings?.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID)
  )

  return NextResponse.json({
    configured: isConfigured,
    voiceId: settings?.elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || 'not-set',
  })
}