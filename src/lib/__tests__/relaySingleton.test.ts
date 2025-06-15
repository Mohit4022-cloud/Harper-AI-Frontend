/**
 * Unit tests for relay singleton bootstrap
 */

import { jest } from '@jest/globals'
import axios from 'axios'
import { spawn } from 'child_process'
import { EventEmitter } from 'events'

// Mock modules
jest.mock('axios')
jest.mock('child_process')
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>

// Import after mocks
import { ensureRelayIsRunning, getRelayStatus, shutdownRelay } from '../relaySingleton'

describe('Relay Singleton Bootstrap', () => {
  let mockProcess: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create mock child process
    mockProcess = new EventEmitter()
    mockProcess.stdout = new EventEmitter()
    mockProcess.stderr = new EventEmitter()
    mockProcess.pid = 12345
    mockProcess.killed = false
    mockProcess.kill = jest.fn(() => {
      mockProcess.killed = true
      mockProcess.emit('exit', 0, null)
    })
    
    // Default spawn mock
    mockedSpawn.mockReturnValue(mockProcess as any)
    
    // Default axios mock - health check fails
    mockedAxios.get.mockRejectedValue(new Error('Connection refused'))
    
    // Reset environment
    process.env.RELAY_PORT = '8000'
  })

  describe('ensureRelayIsRunning', () => {
    it('should spawn a new relay when none exists', async () => {
      // Health check succeeds after spawn
      let healthCheckCount = 0
      mockedAxios.get.mockImplementation(async (url) => {
        healthCheckCount++
        if (healthCheckCount === 1) {
          throw new Error('Connection refused') // First check fails
        }
        return { data: { status: 'healthy' } } // Subsequent checks succeed
      })

      // Start relay
      const promise = ensureRelayIsRunning()
      
      // Simulate relay startup
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Server listening on http://0.0.0.0:8000\n')
      }, 10)

      await promise

      // Verify spawn was called
      expect(mockedSpawn).toHaveBeenCalledWith('node', ['index.js'], expect.objectContaining({
        cwd: expect.stringContaining('productiv-ai-relay'),
        env: expect.objectContaining({
          PORT: '8000'
        })
      }))
    })

    it('should reuse existing healthy relay', async () => {
      // Health check succeeds immediately
      mockedAxios.get.mockResolvedValue({ data: { status: 'healthy' } })

      await ensureRelayIsRunning()

      // Should not spawn
      expect(mockedSpawn).not.toHaveBeenCalled()
    })

    it('should handle port already in use', async () => {
      // First spawn fails with EADDRINUSE
      mockedSpawn.mockImplementationOnce(() => {
        const proc = new EventEmitter() as any
        proc.stdout = new EventEmitter()
        proc.stderr = new EventEmitter()
        proc.killed = false
        
        // Simulate immediate exit with port in use error
        setTimeout(() => {
          proc.stderr.emit('data', 'Error: listen EADDRINUSE: address already in use 0.0.0.0:8000\n')
          proc.emit('exit', 1, null)
        }, 10)
        
        return proc
      })

      // Health check succeeds after error (existing relay found)
      let healthCheckCount = 0
      mockedAxios.get.mockImplementation(async () => {
        healthCheckCount++
        if (healthCheckCount <= 2) {
          throw new Error('Connection refused')
        }
        return { data: { status: 'healthy' } }
      })

      await ensureRelayIsRunning()

      expect(mockedSpawn).toHaveBeenCalledTimes(1)
    })

    it('should restart relay on crash', async () => {
      // Initial health check fails
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'))
      
      // Start relay
      const promise = ensureRelayIsRunning()
      
      // Simulate successful startup
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Server listening\n')
      }, 10)

      await promise

      // Now simulate crash
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'healthy' } })
      mockProcess.emit('exit', 1, null)

      // Wait for restart attempt
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Should have spawned twice (initial + restart)
      expect(mockedSpawn).toHaveBeenCalledTimes(2)
    })

    it('should respect max restart attempts', async () => {
      // All health checks fail
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'))
      
      // All spawns exit immediately
      mockedSpawn.mockImplementation(() => {
        const proc = new EventEmitter() as any
        proc.stdout = new EventEmitter()
        proc.stderr = new EventEmitter()
        proc.killed = false
        proc.kill = jest.fn()
        
        setTimeout(() => {
          proc.emit('exit', 1, null)
        }, 10)
        
        return proc
      })

      // Override MAX_RESTART_ATTEMPTS in module
      const originalEnv = process.env.RELAY_MAX_RESTARTS
      process.env.RELAY_MAX_RESTARTS = '2'

      try {
        await ensureRelayIsRunning()
      } catch (error: any) {
        expect(error.message).toContain('Failed to start relay')
      }

      // Wait for any pending restarts
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Initial attempt + retries
      expect(mockedSpawn).toHaveBeenCalledTimes(3)
      
      process.env.RELAY_MAX_RESTARTS = originalEnv
    })
  })

  describe('getRelayStatus', () => {
    it('should return correct status when relay is running', async () => {
      // Health check succeeds
      mockedAxios.get.mockResolvedValue({ data: { status: 'healthy' } })
      
      // Start relay
      await ensureRelayIsRunning()
      
      const status = await getRelayStatus()
      
      expect(status).toEqual({
        running: false, // No process spawned since health check passed
        healthy: true,
        port: '8000',
        pid: undefined,
        restartCount: 0
      })
    })
  })

  describe('shutdownRelay', () => {
    it('should kill running relay process', async () => {
      // Start a relay
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'))
      const promise = ensureRelayIsRunning()
      
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Server listening\n')
        mockedAxios.get.mockResolvedValue({ data: { status: 'healthy' } })
      }, 10)

      await promise

      // Shutdown
      await shutdownRelay()

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM')
    })
  })
})