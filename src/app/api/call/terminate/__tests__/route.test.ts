/**
 * Unit tests for /api/call/terminate route
 */

import { POST } from '../route'
import { callRelayService } from '@/services/callRelayService'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/services/callRelayService')
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  }
}))

const mockedCallRelayService = callRelayService as jest.Mocked<typeof callRelayService>

describe('/api/call/terminate', () => {
  let mockRequest: jest.Mocked<NextRequest>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {
      json: jest.fn(),
    } as any
  })

  it('should successfully terminate a call', async () => {
    const callSid = 'CA1234567890'
    mockRequest.json.mockResolvedValueOnce({ callSid })
    mockedCallRelayService.terminateCall.mockResolvedValueOnce()

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      message: 'Call terminated successfully',
      callSid,
    })
    expect(mockedCallRelayService.terminateCall).toHaveBeenCalledWith(callSid)
  })

  it('should return 400 if callSid is missing', async () => {
    mockRequest.json.mockResolvedValueOnce({})

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      error: 'Call SID is required'
    })
    expect(mockedCallRelayService.terminateCall).not.toHaveBeenCalled()
  })

  it('should return 504 on timeout error', async () => {
    const callSid = 'CA1234567890'
    mockRequest.json.mockResolvedValueOnce({ callSid })
    mockedCallRelayService.terminateCall.mockRejectedValueOnce(
      new Error('Call termination timed out')
    )

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(504)
    expect(data).toEqual({
      error: 'Call termination timed out',
      details: 'Call termination timed out'
    })
  })

  it('should return 500 on generic error', async () => {
    const callSid = 'CA1234567890'
    mockRequest.json.mockResolvedValueOnce({ callSid })
    mockedCallRelayService.terminateCall.mockRejectedValueOnce(
      new Error('Something went wrong')
    )

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: 'Failed to terminate call',
      details: 'Something went wrong'
    })
  })

  it('should handle non-Error objects', async () => {
    const callSid = 'CA1234567890'
    mockRequest.json.mockResolvedValueOnce({ callSid })
    mockedCallRelayService.terminateCall.mockRejectedValueOnce('String error')

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: 'Failed to terminate call',
      details: 'Unknown error'
    })
  })
})