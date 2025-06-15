/**
 * Unit tests for CallRelayService
 */

import { CallRelayService } from '../callRelayService'
import axios from 'axios'
import * as relaySingleton from '@/lib/relaySingleton'
import { logger } from '@/lib/logger'

// Mock dependencies
jest.mock('axios')
jest.mock('@/lib/relaySingleton')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}))

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedRelaySingleton = relaySingleton as jest.Mocked<typeof relaySingleton>

describe('CallRelayService', () => {
  let service: CallRelayService

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset singleton instance
    ;(CallRelayService as any).instance = undefined
    service = CallRelayService.getInstance()
    
    // Mock ensureRelayIsRunning to resolve by default
    mockedRelaySingleton.ensureRelayIsRunning.mockResolvedValue()
  })

  describe('terminateCall', () => {
    const callSid = 'CA1234567890'

    it('should successfully terminate a call', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { success: true }
      })

      await service.terminateCall(callSid)

      expect(mockedRelaySingleton.ensureRelayIsRunning).toHaveBeenCalled()
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/twilio/terminate_call',
        { callSid },
        {
          timeout: 5000,
          validateStatus: expect.any(Function)
        }
      )
      expect(logger.info).toHaveBeenCalledWith(
        { callSid },
        '[CallRelayService] Terminating call'
      )
      expect(logger.info).toHaveBeenCalledWith(
        { callSid },
        '[CallRelayService] Call terminated successfully'
      )
    })

    it('should throw error on timeout', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded')
      ;(timeoutError as any).code = 'ECONNABORTED'
      mockedAxios.post.mockRejectedValueOnce(timeoutError)

      await expect(service.terminateCall(callSid)).rejects.toThrow('Call termination timed out')

      expect(logger.error).toHaveBeenCalledWith(
        {
          callSid,
          error: 'timeout of 5000ms exceeded'
        },
        '[CallRelayService] Call termination timed out'
      )
    })

    it('should throw error on 4xx response', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 404,
        data: { error: 'Call not found' }
      })

      await expect(service.terminateCall(callSid)).rejects.toThrow('Call not found')

      expect(logger.warn).toHaveBeenCalledWith(
        {
          status: 404,
          data: { error: 'Call not found' },
          callSid
        },
        '[CallRelayService] Call termination failed'
      )
    })

    it('should throw error on 504 response', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        status: 504,
        data: { error: 'Gateway timeout' }
      })

      await expect(service.terminateCall(callSid)).rejects.toThrow('Call termination timed out')

      expect(logger.error).toHaveBeenCalledWith(
        { callSid },
        '[CallRelayService] Call termination timed out'
      )
    })

    it('should handle generic errors', async () => {
      const error = new Error('Network error')
      mockedAxios.post.mockRejectedValueOnce(error)

      await expect(service.terminateCall(callSid)).rejects.toThrow('Network error')

      expect(logger.error).toHaveBeenCalledWith(
        {
          callSid,
          error: 'Network error',
          code: undefined,
          response: undefined
        },
        '[CallRelayService] Failed to terminate call'
      )
    })

    it('should handle errors with response data', async () => {
      const error = {
        message: 'Request failed',
        response: {
          data: { error: 'Invalid request' }
        }
      }
      mockedAxios.post.mockRejectedValueOnce(error)

      await expect(service.terminateCall(callSid)).rejects.toThrow('Invalid request')
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CallRelayService.getInstance()
      const instance2 = CallRelayService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })
})