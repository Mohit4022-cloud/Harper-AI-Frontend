import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { twilioAccountSid, twilioAuthToken, twilioCallerNumber } = body

    if (!twilioAccountSid || !twilioAuthToken || !twilioCallerNumber) {
      return NextResponse.json(
        { error: 'Missing required Twilio credentials' },
        { status: 400 }
      )
    }

    // Create Twilio client with provided credentials
    const client = twilio(twilioAccountSid, twilioAuthToken)

    // Test the credentials by fetching the phone number details
    try {
      const phoneNumber = await client.incomingPhoneNumbers
        .list({ phoneNumber: twilioCallerNumber, limit: 1 })
      
      if (phoneNumber.length === 0) {
        return NextResponse.json(
          { error: 'Phone number not found in this account' },
          { status: 400 }
        )
      }

      // Optionally, verify the account status
      const account = await client.api.accounts(twilioAccountSid).fetch()
      
      if (account.status !== 'active') {
        return NextResponse.json(
          { error: `Account is ${account.status}. Please activate your account.` },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Twilio connection successful!',
        accountName: account.friendlyName,
        phoneNumber: phoneNumber[0].friendlyName || phoneNumber[0].phoneNumber,
      })
    } catch (twilioError: any) {
      console.error('Twilio verification error:', twilioError)
      
      if (twilioError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Account SID or Auth Token' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: twilioError.message || 'Failed to verify Twilio credentials' },
        { status: twilioError.status || 400 }
      )
    }
  } catch (error) {
    console.error('Test Twilio error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test Twilio connection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}