'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCallStore } from '@/stores/callStore'
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Clock,
  User,
} from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

interface CallInterfaceProps {
  className?: string
}

export function CallInterface({ className }: CallInterfaceProps) {
  const {
    currentCall,
    isDialerOpen,
    isMuted,
    isOnHold,
    twilioDevice,
    isDeviceReady,
    setCurrentCall,
    toggleMute,
    toggleHold,
    endCall,
    openDialer,
    closeDialer,
  } = useCallStore()

  const [dialNumber, setDialNumber] = useState('')
  const [callDuration, setCallDuration] = useState(0)

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (currentCall && currentCall.status === 'in-progress') {
      interval = setInterval(() => {
        const startTime = new Date(currentCall.startedAt).getTime()
        const now = Date.now()
        setCallDuration(Math.floor((now - startTime) / 1000))
      }, 1000)
    } else {
      setCallDuration(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentCall])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleDialPadClick = (digit: string) => {
    setDialNumber(prev => prev + digit)
  }

  const handleCall = () => {
    if (!dialNumber.trim()) return

    // Mock call creation - in real implementation, this would use Twilio
    const newCall = {
      id: Date.now().toString(),
      contactId: '',
      userId: 'current-user',
      phoneNumber: dialNumber,
      direction: 'outbound' as const,
      status: 'ringing' as const,
      startedAt: new Date(),
    }

    setCurrentCall(newCall)
    
    // Simulate call progression
    setTimeout(() => {
      setCurrentCall({ ...newCall, status: 'in-progress' })
    }, 2000)
  }

  const handleEndCall = () => {
    endCall()
    setDialNumber('')
    closeDialer()
  }

  const dialPadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ]

  if (currentCall) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">{formatPhoneNumber(currentCall.phoneNumber)}</CardTitle>
          <p className="text-sm text-gray-600 capitalize">{currentCall.status}</p>
          {currentCall.status === 'in-progress' && (
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {formatDuration(callDuration)}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-center space-x-4">
            <Button
              variant={isMuted ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleMute}
              className="h-12 w-12 rounded-full"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isOnHold ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleHold}
              className="h-12 w-12 rounded-full"
            >
              {isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={handleEndCall}
              className="h-12 w-12 rounded-full"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">Make a Call</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Input
          type="tel"
          placeholder="Enter phone number"
          value={dialNumber}
          onChange={(e) => setDialNumber(e.target.value)}
          className="text-center text-lg"
        />
        
        {isDialerOpen && (
          <div className="grid grid-cols-3 gap-3">
            {dialPadNumbers.map((row, rowIndex) =>
              row.map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => handleDialPadClick(digit)}
                >
                  {digit}
                </Button>
              ))
            )}
          </div>
        )}
        
        <div className="flex justify-center space-x-3">
          {!isDialerOpen && (
            <Button
              variant="outline"
              onClick={openDialer}
              className="flex-1"
            >
              Show Dialpad
            </Button>
          )}
          
          <Button
            onClick={handleCall}
            disabled={!dialNumber.trim() || !isDeviceReady}
            className="flex-1 gradient-purple-pink hover:opacity-90"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        </div>
        
        {isDialerOpen && (
          <Button
            variant="outline"
            onClick={closeDialer}
            className="w-full"
          >
            Hide Dialpad
          </Button>
        )}
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Device Status: {isDeviceReady ? '🟢 Ready' : '🔴 Not Ready'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}