import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const digits = formData.get('Digits') as string
    
    const twiml = new twilio.twiml.VoiceResponse()
    
    switch (digits) {
      case '1':
        // Replay the message
        twiml.redirect(`${process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL}/api/call/voice`)
        break
      case '2':
        // End the call
        twiml.say('Thank you for calling Harper AI. Goodbye!')
        twiml.hangup()
        break
      default:
        // Invalid input
        twiml.say('Invalid selection.')
        twiml.redirect(`${process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL}/api/call/voice`)
        break
    }
    
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Error processing gather:', error)
    
    const errorTwiml = new twilio.twiml.VoiceResponse()
    errorTwiml.say('Sorry, there was an error.')
    errorTwiml.hangup()
    
    return new NextResponse(errorTwiml.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}