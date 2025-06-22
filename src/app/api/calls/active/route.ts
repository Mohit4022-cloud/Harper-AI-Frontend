/**
 * Active Calls API Route
 *
 * Manages and retrieves information about currently active calls
 */

import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'

/**
 * GET /api/calls/active
 *
 * Retrieves list of currently active calls
 *
 * Query parameters:
 * - userId: Filter by specific user
 * - status: Filter by call status (ringing, connected, on_hold)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Mock active calls data
    const activeCalls = {
      calls: [
        {
          id: 'call_1',
          userId: 'user_1',
          contactName: 'John Doe',
          phoneNumber: '+1234567890',
          status: 'connected',
          duration: 120,
          startTime: new Date(Date.now() - 120000).toISOString(),
          direction: 'outbound',
        },
      ],
      total: 1,
    }

    // Apply filters if provided
    let filteredCalls = activeCalls.calls

    if (userId) {
      filteredCalls = filteredCalls.filter((call) => call.userId === userId)
    }

    if (status) {
      filteredCalls = filteredCalls.filter((call) => call.status === status)
    }

    return NextResponse.json({
      calls: filteredCalls,
      total: filteredCalls.length,
    })
  } catch (error) {
    console.error('Error fetching active calls:', error)
    return NextResponse.json({ error: 'Failed to fetch active calls' }, { status: 500 })
  }
}

/**
 * POST /api/calls/active
 *
 * Updates the status of an active call
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callId, action } = body

    if (!callId || !action) {
      return NextResponse.json({ error: 'Call ID and action are required' }, { status: 400 })
    }

    // Valid actions: mute, unmute, hold, unhold, transfer, end
    const validActions = ['mute', 'unmute', 'hold', 'unhold', 'transfer', 'end']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // In production, this would interact with Twilio or your telephony provider
    console.log(`Performing action ${action} on call ${callId}`)

    return NextResponse.json({
      success: true,
      callId,
      action,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating active call:', error)
    return NextResponse.json({ error: 'Failed to update call' }, { status: 500 })
  }
}
