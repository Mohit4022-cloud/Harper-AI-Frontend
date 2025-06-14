import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function GET(req: NextRequest) {
  try {
    const twiml = new twilio.twiml.VoiceResponse()
    
    // Use ElevenLabs MP3 if available
    const elevenLabsUrl = process.env.ELEVENLABS_AUDIO_URL
    
    if (elevenLabsUrl) {
      // Play ElevenLabs generated audio
      twiml.play(elevenLabsUrl)
    } else {
      // Fallback to Twilio's Polly voice
      twiml.say(
        {
          voice: 'Polly.Joanna',
          language: 'en-US',
        },
        'Hello! This is Harper AI calling. We\'re testing our new outbound calling system powered by Twilio and Eleven Labs. How exciting is that? Have a wonderful day!'
      )
    }
    
    // Optional: Gather input
    const gather = twiml.gather({
      numDigits: 1,
      action: `${process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL}/api/call/gather`,
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