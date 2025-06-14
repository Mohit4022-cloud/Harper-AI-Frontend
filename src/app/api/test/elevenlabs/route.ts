import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { elevenLabsKey, elevenLabsVoiceId } = body

    if (!elevenLabsKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key is required' },
        { status: 400 }
      )
    }

    // Test the API key by fetching user info
    const userResponse = await fetch(`${ELEVENLABS_API_URL}/user`, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsKey,
      },
    })

    if (!userResponse.ok) {
      if (userResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
      
      const error = await userResponse.text()
      return NextResponse.json(
        { error: 'Failed to verify API key' },
        { status: userResponse.status }
      )
    }

    const userData = await userResponse.json()

    // If a voice ID is provided, verify it exists
    if (elevenLabsVoiceId) {
      const voiceResponse = await fetch(
        `${ELEVENLABS_API_URL}/voices/${elevenLabsVoiceId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': elevenLabsKey,
          },
        }
      )

      if (!voiceResponse.ok) {
        return NextResponse.json(
          { error: 'Voice ID not found' },
          { status: 404 }
        )
      }

      const voiceData = await voiceResponse.json()

      return NextResponse.json({
        success: true,
        message: 'ElevenLabs connection successful!',
        subscription: userData.subscription?.tier || 'Free',
        characterCount: userData.subscription?.character_count || 0,
        characterLimit: userData.subscription?.character_limit || 10000,
        voiceName: voiceData.name,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'ElevenLabs connection successful!',
      subscription: userData.subscription?.tier || 'Free',
      characterCount: userData.subscription?.character_count || 0,
      characterLimit: userData.subscription?.character_limit || 10000,
    })
  } catch (error) {
    console.error('Test ElevenLabs error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test ElevenLabs connection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}