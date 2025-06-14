import { NextRequest, NextResponse } from 'next/server'
import { UserSettingsSchema, defaultUserSettings } from '@/types/settings'
import { z } from 'zod'

// In-memory storage for settings (replace with real DB in production)
declare global {
  var userSettings: any
}

if (!global.userSettings) {
  global.userSettings = { ...defaultUserSettings }
}

/**
 * GET /api/settings
 * Retrieve user settings
 */
export async function GET(request: NextRequest) {
  try {
    // In production, you would:
    // 1. Get user ID from JWT token
    // 2. Fetch settings from database by user ID
    
    // For now, return global settings
    return NextResponse.json({
      success: true,
      data: global.userSettings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate settings data
    const validatedSettings = UserSettingsSchema.parse(body)
    
    // In production, you would:
    // 1. Get user ID from JWT token
    // 2. Update settings in database
    // 3. Handle password hashing if password is being updated
    
    // For now, update global settings
    global.userSettings = validatedSettings
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    // Don't return password in response
    const responseData = { ...validatedSettings }
    if (responseData.profile.password) {
      responseData.profile.password = undefined
    }
    
    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid settings data',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings
 * Reset settings to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    // In production, you would:
    // 1. Get user ID from JWT token
    // 2. Reset user settings in database
    
    // Reset to defaults
    global.userSettings = { ...defaultUserSettings }
    
    return NextResponse.json({
      success: true,
      message: 'Settings reset to defaults',
      data: global.userSettings,
    })
  } catch (error) {
    console.error('Error resetting settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset settings',
      },
      { status: 500 }
    )
  }
}