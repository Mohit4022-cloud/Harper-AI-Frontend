import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, validatePassword } from '@/lib/mockData'
import { generateTokens } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user and validate password
    const user = findUserByEmail(email)
    if (!user || !validatePassword(email, password)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user)

    // Update last login (in real app, this would update the database)
    user.lastLoginAt = new Date()

    return NextResponse.json({
      success: true,
      data: {
        user,
        token,
        refreshToken,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}