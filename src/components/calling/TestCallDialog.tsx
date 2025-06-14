'use client'

import { useState, useEffect } from 'react'
import { Phone, Loader2, CheckCircle2, XCircle, Volume2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api-client'
import { useSettingsStore } from '@/stores/settingsStore'

interface CallResponse {
  success: boolean
  callSid?: string
  status?: string
  error?: string
  details?: string
}

interface TranscriptEntry {
  role: 'user' | 'agent'
  text: string
  timestamp: string
}

export function TestCallDialog() {
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null)
  const [isPollingTranscript, setIsPollingTranscript] = useState(false)
  const { settings } = useSettingsStore()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'success' | 'error'>('idle')
  const [callDetails, setCallDetails] = useState<CallResponse | null>(null)
  const { toast } = useToast()

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as US phone number
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleTestCall = async () => {
    // Convert formatted number to E.164 format
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length !== 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid 10-digit US phone number',
        variant: 'destructive',
      })
      return
    }

    const e164Phone = `+1${digits}`
    
    setIsLoading(true)
    setCallStatus('calling')
    setCallDetails(null)

    try {
      // Pass settings from UI store to ensure they're used
      const data = await api.post<CallResponse>('/api/call/start', { 
        phone: e164Phone,
        settings: settings // Include UI settings
      })

      if (data.success) {
        setCallStatus('success')
        setCallDetails(data)
        setCurrentCallSid(data.callSid || null)
        setIsPollingTranscript(true)
        toast({
          title: 'Call initiated!',
          description: 'You should receive a call shortly.',
        })
      } else {
        setCallStatus('error')
        setCallDetails(data)
        toast({
          title: 'Call failed',
          description: data.error || 'Failed to initiate call',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      setCallStatus('error')
      setCallDetails({
        success: false,
        error: error.message || 'Network error',
        details: error.details || 'Unable to connect to the server',
      })
      toast({
        title: 'Unable to start call',
        description: 'Please check your network connection or Twilio credentials.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetDialog = () => {
    setPhoneNumber('')
    setCallStatus('idle')
    setCallDetails(null)
    setTranscript([])
    setCurrentCallSid(null)
    setIsPollingTranscript(false)
  }

  // Poll for transcript updates
  useEffect(() => {
    if (!currentCallSid || !isPollingTranscript) return

    const pollTranscript = async () => {
      try {
        const data = await api.get(`/api/call/transcript?callSid=${currentCallSid}`)
        if (data.transcript && data.transcript.length > 0) {
          setTranscript(data.transcript)
        }
      } catch (error) {
        console.error('Error fetching transcript:', error)
      }
    }

    // Initial poll
    pollTranscript()

    // Set up polling interval
    const interval = setInterval(pollTranscript, 2000)

    return () => clearInterval(interval)
  }, [currentCallSid, isPollingTranscript])

  // Stop polling after 60 seconds
  useEffect(() => {
    if (isPollingTranscript) {
      const timeout = setTimeout(() => {
        setIsPollingTranscript(false)
      }, 60000)

      return () => clearTimeout(timeout)
    }
  }, [isPollingTranscript])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetDialog()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
          <Phone className="h-4 w-4 mr-2" />
          Test Call
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Test Twilio Integration
          </DialogTitle>
          <DialogDescription>
            Enter your phone number to receive a test call from Harper AI powered by Twilio and ElevenLabs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {callStatus === 'idle' && (
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                US numbers only. We'll call you immediately.
              </p>
            </div>
          )}

          {callStatus === 'calling' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <Phone className="h-16 w-16 text-purple-600 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-20 w-20 text-purple-600/20 animate-spin" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Initiating call to {phoneNumber}...
              </p>
            </div>
          )}

          {callStatus === 'success' && callDetails && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Call initiated successfully! You should receive a call within seconds.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Call SID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {callDetails.callSid?.slice(0, 20)}...
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="capitalize">
                    {callDetails.status}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  What you'll hear:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                  <li>• A greeting from Harper AI</li>
                  <li>• Options to replay or end the call</li>
                  <li>• ElevenLabs voice (if configured)</li>
                </ul>
              </div>
            </div>
          )}

          {callStatus === 'error' && callDetails && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {callDetails.error || 'Failed to initiate call'}
                </AlertDescription>
              </Alert>
              
              {callDetails.details && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                  <p className="font-medium mb-1">Error details:</p>
                  <code>{callDetails.details}</code>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Troubleshooting:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Ensure Twilio credentials are set in .env</li>
                  <li>• Verify your Twilio phone number is active</li>
                  <li>• Check that the number can make outbound calls</li>
                  <li>• Confirm webhook URLs are accessible</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Section */}
        {transcript.length > 0 && (
          <div className="mt-4">
            <Label className="text-sm font-medium">Live Transcript</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-4 mt-2">
              <div className="space-y-3">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 ${
                      entry.role === 'agent' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        entry.role === 'agent'
                          ? 'bg-white dark:bg-gray-800 border'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {entry.role === 'agent' ? 'AI Agent' : 'Caller'}
                      </p>
                      <p className="text-sm">{entry.text}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {callStatus === 'idle' && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTestCall} 
                disabled={!phoneNumber || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Make Test Call
                  </>
                )}
              </Button>
            </>
          )}
          
          {(callStatus === 'success' || callStatus === 'error') && (
            <>
              <Button 
                variant="outline" 
                onClick={resetDialog}
              >
                Try Another Number
              </Button>
              <Button onClick={() => setOpen(false)}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}