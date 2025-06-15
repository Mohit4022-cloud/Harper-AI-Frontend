import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function GET(req: NextRequest) {
  try {
    const twiml = new twilio.twiml.VoiceResponse()
    
    // Get settings from in-memory store
    const settingsModule = await import('@/app/api/settings/route')
    const settingsResponse = await settingsModule.GET(req)
    
    const settingsData = await settingsResponse.json()
    const settings = settingsData.data?.integrations
    
    // Use ElevenLabs MP3 if available
    const elevenLabsUrl = settings?.elevenLabsAudioUrl || process.env.ELEVENLABS_AUDIO_URL
    
    // Get the WebSocket URL for media streaming
    const relayPort = process.env.RELAY_PORT || '8000'
    const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws'
    const wsHost = process.env.NODE_ENV === 'production' 
      ? req.headers.get('host') || 'localhost'
      : `localhost:${relayPort}`
    const mediaStreamUrl = `${wsProtocol}://${wsHost}/media-stream`
    
    // Connect to the WebSocket stream
    const connect = twiml.connect()
    connect.stream({
      url: mediaStreamUrl,
    })
    
    // Optional: Gather input
    const baseUrl = settings?.baseUrl || process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL
    const gather = twiml.gather({
      numDigits: 1,
      action: `${baseUrl}/api/call/gather`,
      method: 'POST',
    })
    
    gather.say(
      {
        voice: 'Polly.Joanna',
        language: 'en-US',
      },
      'Press 1 to hear this message again, or press 2 to end the call.'
    )
    
    // If no input, hang up
    twiml.say('Thank you for testing Harper AI. Goodbye!')
    twiml.hangup()

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Error generating TwiML:', error)
    
    // Return basic TwiML on error
    const errorTwiml = new twilio.twiml.VoiceResponse()
    errorTwiml.say('Sorry, there was an error processing your call.')
    errorTwiml.hangup()
    
    return new NextResponse(errorTwiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

export async function POST(req: NextRequest) {
  // Handle POST requests (e.g., from statusCallback)
  return GET(req)
}