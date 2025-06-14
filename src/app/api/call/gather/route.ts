import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const digits = formData.get('Digits') as string
    
    // Get settings from API
    const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const settingsData = await settingsResponse.json()
    const settings = settingsData.data?.integrations
    const baseUrl = settings?.baseUrl || process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL
    
    const twiml = new twilio.twiml.VoiceResponse()
    
    switch (digits) {
      case '1':
        // Replay the message
        twiml.redirect(`${baseUrl}/api/call/voice`)
        break
      case '2':
        // End the call
        twiml.say('Thank you for calling Harper AI. Goodbye!')
        twiml.hangup()
        break
      default:
        // Invalid input
        twiml.say('Invalid selection.')
        twiml.redirect(`${baseUrl}/api/call/voice`)
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