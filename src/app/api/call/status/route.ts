import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    // Extract Twilio status callback parameters
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const duration = formData.get('CallDuration') as string
    const timestamp = formData.get('Timestamp') as string

    console.log('Call status update:', {
      callSid,
      callStatus,
      from,
      to,
      duration,
      timestamp,
    })

    // Here you could:
    // - Update call record in database
    // - Send websocket update to frontend
    // - Log analytics
    // - Trigger follow-up actions

    // For now, just log and acknowledge
    return new NextResponse('', { status: 200 })
  } catch (error) {
    console.error('Error processing call status:', error)
    return new NextResponse('', { status: 200 }) // Always return 200 for Twilio
  }
}