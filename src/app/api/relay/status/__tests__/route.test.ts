/**
 * Unit tests for /api/relay/status route
 */

import { GET } from '../route'
import axios from 'axios'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('axios')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}))

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('/api/relay/status', () => {
  let mockRequest: jest.Mocked<NextRequest>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {} as any
    
    // Reset environment variables
    delete process.env.RELAY_PORT
  })
  
  afterEach(() => {
    // Clean up environment variables
    delete process.env.RELAY_PORT
  })

  it('should return relay up when health check succeeds', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { healthy: true }
    })

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ relay: 'up' })
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:8000/health',
      {
        timeout: 2000,
        validateStatus: expect.any(Function)
      }
    )
  })

  it('should use custom RELAY_PORT from environment', async () => {
    process.env.RELAY_PORT = '9000'
    
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { healthy: true }
    })

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ relay: 'up' })
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:9000/health',
      expect.any(Object)
    )
  })

  it('should return relay down with non-200 status', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 503,
      data: { error: 'Service unavailable' }
    })

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      relay: 'down',
      error: 'Relay returned status 503'
    })
  })

  it('should handle connection refused error', async () => {
    const error = new Error('connect ECONNREFUSED')
    ;(error as any).code = 'ECONNREFUSED'
    mockedAxios.get.mockRejectedValueOnce(error)

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      relay: 'down',
      error: 'Relay service is not running'
    })
  })

  it('should handle timeout error', async () => {
    const error = new Error('timeout of 2000ms exceeded')
    ;(error as any).code = 'ECONNABORTED'
    mockedAxios.get.mockRejectedValueOnce(error)

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      relay: 'down',
      error: 'Relay health check timed out'
    })
  })

  it('should handle generic errors', async () => {
    const error = new Error('Network error')
    mockedAxios.get.mockRejectedValueOnce(error)

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      relay: 'down',
      error: 'Network error'
    })
  })

  it('should handle errors without message', async () => {
    mockedAxios.get.mockRejectedValueOnce({})

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      relay: 'down',
      error: 'Unknown error'
    })
  })

  it('should validate status code correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { healthy: true }
    })

    await GET(mockRequest)

    // Get the validateStatus function
    const validateStatus = mockedAxios.get.mock.calls[0][1]?.validateStatus
    
    // It should accept any status
    expect(validateStatus).toBeDefined()
    expect(validateStatus!(200)).toBe(true)
    expect(validateStatus!(404)).toBe(true)
    expect(validateStatus!(500)).toBe(true)
  })
})