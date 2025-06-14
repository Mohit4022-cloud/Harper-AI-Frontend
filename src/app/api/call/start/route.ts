import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioNumber = process.env.TWILIO_CALLER_NUMBER
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL

    if (!accountSid || !authToken || !twilioNumber) {
      return NextResponse.json(
        { error: 'Twilio configuration missing' },
        { status: 500 }
      )
    }

    const client = twilio(accountSid, authToken)

    // TwiML webhook URL
    const twimlUrl = `${baseUrl}/api/call/voice`

    const call = await client.calls.create({
      url: twimlUrl,
      to: phone,
      from: twilioNumber,
      method: 'GET',
      statusCallback: `${baseUrl}/api/call/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    })

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      direction: call.direction,
      from: call.from,
      to: call.to,
    })
  } catch (error) {
    console.error('Error starting call:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start call', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}