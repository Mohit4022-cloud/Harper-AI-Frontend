import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateTokens } from '@/lib/jwt'
import { mockUsers } from '@/lib/mockData'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Find user
    const user = mockUsers.find(u => u.id === payload.userId)
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'User not found or inactive' },
        { status: 401 }
      )
    }

    // Generate new tokens
    const tokens = generateTokens(user)

    return NextResponse.json({
      success: true,
      data: tokens,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}