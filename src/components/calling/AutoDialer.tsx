'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Device } from '@twilio/voice-sdk'
import { Play, Pause, SkipForward, PhoneOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCallQueueStore } from '@/stores/callQueueStore'
import { generateMockTranscript } from '@/lib/mockContacts'
import { cn } from '@/lib/utils'

interface AutoDialerProps {
  device: Device | null
  isDeviceReady: boolean
}

export function AutoDialer({ device, isDeviceReady }: AutoDialerProps) {
  const {
    queue,
    currentIndex,
    activeCall,
    isAutoDialing,
    isPaused,
    nextInQueue,
    skipCurrent,
    startCall,
    endCall,
    toggleAutoDialing,
    pauseAutoDialing,
    resumeAutoDialing,
    addTranscriptLine,
    clearTranscript,
  } = useCallQueueStore()

  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [mockMode, setMockMode] = useState(!isDeviceReady)

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [activeCall])

  // Mock call simulation
  const simulateMockCall = useCallback(async (contact: any) => {
    setIsConnecting(true)
    clearTranscript()
    
    // Simulate ringing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    // Update status to connected
    if (activeCall) {
      activeCall.status = 'connected'
    }
    setIsConnecting(false)
    
    // Generate mock transcript over time
    const transcript = generateMockTranscript(60)
    for (let i = 0; i < transcript.length; i++) {
      if (!isAutoDialing || isPaused) break
      await new Promise((resolve) => setTimeout(resolve, 3000))
      addTranscriptLine(transcript[i])
    }
    
    // End call
    endCall('completed', 60)
  }, [activeCall, isAutoDialing, isPaused, addTranscriptLine, endCall, clearTranscript])

  // Real Twilio call
  const makeTwilioCall = useCallback(async (contact: any) => {
    if (!device || !isDeviceReady) {
      setError('Twilio device not ready')
      return
    }

    setIsConnecting(true)
    clearTranscript()
    
    try {
      const call = await device.connect({
        params: {
          To: contact.phone,
        },
      })
      
      call.on('accept', () => {
        setIsConnecting(false)
        if (activeCall) {
          activeCall.status = 'connected'
        }
      })
      
      call.on('disconnect', () => {
        endCall('completed', callDuration)
      })
      
      call.on('error', (error) => {
        console.error('Call error:', error)
        setError(`Call failed: ${error.message}`)
        endCall('failed', 0)
      })
      
    } catch (err) {
      setError(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`)
      endCall('failed', 0)
      setIsConnecting(false)
    }
  }, [device, isDeviceReady, activeCall, callDuration, endCall, clearTranscript])

  // Auto-dial logic
  useEffect(() => {
    const dial = async () => {
      if (!isAutoDialing || isPaused || activeCall || isConnecting) return
      
      const contact = nextInQueue()
      if (!contact) {
        toggleAutoDialing() // Stop auto-dialing when queue is empty
        return
      }
      
      startCall(contact)
      
      if (mockMode) {
        await simulateMockCall(contact)
      } else {
        await makeTwilioCall(contact)
      }
    }
    
    dial()
  }, [
    isAutoDialing,
    isPaused,
    activeCall,
    isConnecting,
    mockMode,
    nextInQueue,
    startCall,
    toggleAutoDialing,
    simulateMockCall,
    makeTwilioCall,
  ])

  const handleStartStop = () => {
    setError(null)
    if (queue.length === 0) {
      setError('Please upload contacts first')
      return
    }
    toggleAutoDialing()
  }

  const handleSkip = () => {
    if (activeCall) {
      // If there's an active call, end it
      endCall('failed', callDuration)
    }
    skipCurrent()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Dialer</CardTitle>
        <CardDescription>
          {queue.length > 0
            ? `${currentIndex} of ${queue.length} contacts called`
            : 'No contacts in queue'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {queue.length > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Remaining: {queue.length - currentIndex}</span>
            </div>
          </div>
        )}

        {/* Current Call Info */}
        {activeCall && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activeCall.contactName}</p>
                <p className="text-sm text-muted-foreground">{activeCall.contactCompany}</p>
                <p className="text-xs font-mono">{activeCall.phone}</p>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    activeCall.status === 'connected'
                      ? 'default'
                      : activeCall.status === 'ringing'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={cn(
                    activeCall.status === 'connected' && 'animate-pulse'
                  )}
                >
                  {activeCall.status}
                </Badge>
                {activeCall.status === 'connected' && (
                  <p className="text-sm mt-1">{formatDuration(callDuration)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mock Mode Indicator */}
        {mockMode && (
          <Alert>
            <AlertDescription>
              Running in mock mode (no Twilio credentials detected)
            </AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartStop}
            variant={isAutoDialing ? 'destructive' : 'default'}
            disabled={isConnecting}
            className="flex-1"
          >
            {isAutoDialing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Auto-Dial
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Auto-Dial
              </>
            )}
          </Button>

          {isAutoDialing && (
            <>
              <Button
                onClick={isPaused ? resumeAutoDialing : pauseAutoDialing}
                variant="outline"
                disabled={!activeCall}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>

              <Button
                onClick={handleSkip}
                variant="outline"
                disabled={!activeCall && currentIndex >= queue.length}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {activeCall && (
                <Button
                  onClick={() => endCall('completed', callDuration)}
                  variant="destructive"
                  size="icon"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Next in Queue Preview */}
        {queue.length > currentIndex && !activeCall && (
          <div className="mt-4 p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Next in queue:</p>
            <p className="text-sm font-medium">{queue[currentIndex].name}</p>
            <p className="text-xs text-muted-foreground">
              {queue[currentIndex].company} • {queue[currentIndex].title}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}