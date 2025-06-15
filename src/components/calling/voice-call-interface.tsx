'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useActiveCall } from '@/hooks/use-active-call'
import { wsManager } from '@/lib/websocket'
import { cn } from '@/lib/utils'
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Minimize2,
  Maximize2,
  Settings,
  MessageSquare,
  Activity,
  Clock,
  User,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TranscriptEntry, CallStatus } from '@/types/brand'
import { formatDuration } from '@/lib/utils'

export function VoiceCallInterface() {
  const { activeCall, endCall, updateActiveCall } = useActiveCall()
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [sentimentScore, setSentimentScore] = useState(0.5)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const audioLevelRef = useRef<HTMLDivElement>(null)
  
  // Call duration timer
  useEffect(() => {
    if (!activeCall?.startTime) return
    
    const interval = setInterval(() => {
      setCallDuration(Date.now() - activeCall.startTime.getTime())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [activeCall])
  
  // WebSocket event handlers
  useEffect(() => {
    if (!activeCall) return
    
    const handleAIResponse = (data: any) => {
      if (data.callId === activeCall.id) {
        const entry: TranscriptEntry = {
          speaker: 'ai',
          text: data.message,
          timestamp: new Date(data.timestamp),
          sentiment: data.sentiment,
        }
        
        setTranscript(prev => [...prev, entry])
        setSentimentScore(data.sentiment)
      }
    }
    
    const handleTranscriptUpdate = (data: any) => {
      if (data.callId === activeCall.id) {
        const entry: TranscriptEntry = {
          speaker: data.speaker,
          text: data.text,
          timestamp: new Date(data.timestamp),
          sentiment: data.sentiment,
        }
        
        setTranscript(prev => [...prev, entry])
      }
    }
    
    const handleAISuggestion = (data: any) => {
      if (data.callId === activeCall.id) {
        setAiSuggestions(data.suggestions)
      }
    }
    
    // Subscribe to WebSocket events
    wsManager.socket?.on('ai:response', handleAIResponse)
    wsManager.socket?.on('transcript:update', handleTranscriptUpdate)
    wsManager.socket?.on('ai:suggestion', handleAISuggestion)
    
    return () => {
      wsManager.socket?.off('ai:response', handleAIResponse)
      wsManager.socket?.off('transcript:update', handleTranscriptUpdate)
      wsManager.socket?.off('ai:suggestion', handleAISuggestion)
    }
  }, [activeCall])
  
  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])
  
  // Audio level visualization
  useEffect(() => {
    if (!activeCall || !audioLevelRef.current) return
    
    const animateAudioLevel = () => {
      if (audioLevelRef.current) {
        const level = Math.random() * 100 // Simulate audio level
        audioLevelRef.current.style.height = `${level}%`
      }
    }
    
    const interval = setInterval(animateAudioLevel, 100)
    return () => clearInterval(interval)
  }, [activeCall])
  
  if (!activeCall) return null
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
    // Send mute state to backend
    wsManager.emit('call:mute', {
      callId: activeCall.id,
      muted: !isMuted,
    })
  }
  
  const handleEndCall = async () => {
    try {
      await endCall()
      setTranscript([])
      setAiSuggestions([])
      setSentimentScore(0.5)
    } catch (error) {
      console.error('Failed to end call:', error)
    }
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMinimized ? 320 : 480,
          height: isMinimized ? 120 : 600,
        }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-6 right-6 bg-background border rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <CallHeader 
          activeCall={activeCall}
          callDuration={callDuration}
          sentimentScore={sentimentScore}
          isMinimized={isMinimized}
          onMinimize={() => setIsMinimized(!isMinimized)}
        />
        
        {!isMinimized && (
          <>
            {/* Audio Visualization */}
            <AudioVisualization 
              isActive={activeCall.status === 'connected'}
              isMuted={isMuted}
            />
            
            {/* Transcript */}
            <CallTranscript 
              transcript={transcript}
              transcriptRef={transcriptRef}
            />
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <AISuggestions suggestions={aiSuggestions} />
            )}
            
            {/* Controls */}
            <CallControls
              isMuted={isMuted}
              onMuteToggle={handleMuteToggle}
              onEndCall={handleEndCall}
              callStatus={activeCall.status}
            />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function CallHeader({ 
  activeCall, 
  callDuration, 
  sentimentScore,
  isMinimized,
  onMinimize 
}: {
  activeCall: any
  callDuration: number
  sentimentScore: number
  isMinimized: boolean
  onMinimize: () => void
}) {
  const getSentimentColor = (score: number) => {
    if (score > 0.7) return 'text-green-500 bg-green-50'
    if (score > 0.4) return 'text-yellow-500 bg-yellow-50'
    return 'text-red-500 bg-red-50'
  }
  
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-green-500">
            <AvatarImage src={activeCall.contact?.avatar} />
            <AvatarFallback className="bg-green-50 text-green-700">
              {activeCall.contact?.firstName?.[0]}{activeCall.contact?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          {!isMinimized && (
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">
                {activeCall.contact?.firstName} {activeCall.contact?.lastName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(callDuration)}
                
                <Separator orientation="vertical" className="h-3" />
                
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                  getSentimentColor(sentimentScore)
                )}>
                  <Activity className="h-3 w-3" />
                  {Math.round(sentimentScore * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <CallStatusBadge status={activeCall.status} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="h-8 w-8"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {isMinimized && (
        <div className="text-sm text-muted-foreground">
          {formatDuration(callDuration)} • {Math.round(sentimentScore * 100)}% sentiment
        </div>
      )}
    </CardHeader>
  )
}

function CallStatusBadge({ status }: { status: CallStatus }) {
  const getStatusConfig = (status: CallStatus) => {
    switch (status) {
      case 'initiated':
        return { label: 'Calling...', variant: 'secondary', pulse: true }
      case 'ringing':
        return { label: 'Ringing', variant: 'outline', pulse: true }
      case 'connected':
        return { label: 'Connected', variant: 'success', pulse: false }
      case 'ended':
        return { label: 'Ended', variant: 'secondary', pulse: false }
      case 'failed':
        return { label: 'Failed', variant: 'destructive', pulse: false }
      default:
        return { label: 'Unknown', variant: 'secondary', pulse: false }
    }
  }
  
  const config = getStatusConfig(status)
  
  return (
    <Badge 
      variant={config.variant as any}
      className={cn(
        "text-xs",
        config.pulse && "animate-pulse"
      )}
    >
      {config.label}
    </Badge>
  )
}

function AudioVisualization({ 
  isActive, 
  isMuted 
}: { 
  isActive: boolean
  isMuted: boolean 
}) {
  return (
    <div className="px-6 py-3 bg-muted/20">
      <div className="flex items-center justify-center gap-1 h-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-1 bg-gradient-to-t rounded-full",
              isMuted ? "from-gray-300 to-gray-400" :
              isActive ? "from-green-400 to-green-600" : "from-blue-400 to-blue-600"
            )}
            animate={{
              height: isActive && !isMuted ? [4, 20, 8, 16, 12] : [4, 4, 4, 4, 4],
            }}
            transition={{
              duration: 0.5,
              repeat: isActive && !isMuted ? Infinity : 0,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CallTranscript({ 
  transcript, 
  transcriptRef 
}: { 
  transcript: TranscriptEntry[]
  transcriptRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <div className="flex-1 border-t">
      <div className="px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          Live Transcript
        </div>
      </div>
      
      <ScrollArea className="h-64 px-4">
        <div ref={transcriptRef} className="space-y-3 py-4">
          {transcript.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Transcript will appear here when the call starts...
            </div>
          ) : (
            transcript.map((entry, index) => (
              <TranscriptMessage key={index} entry={entry} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  const getSpeakerConfig = (speaker: TranscriptEntry['speaker']) => {
    switch (speaker) {
      case 'ai':
        return { 
          label: 'AI Assistant', 
          color: 'bg-blue-500 text-white',
          align: 'justify-start' 
        }
      case 'user':
        return { 
          label: 'You', 
          color: 'bg-primary text-primary-foreground',
          align: 'justify-end' 
        }
      case 'contact':
        return { 
          label: 'Contact', 
          color: 'bg-muted text-muted-foreground',
          align: 'justify-start' 
        }
      default:
        return { 
          label: 'Unknown', 
          color: 'bg-gray-500 text-white',
          align: 'justify-start' 
        }
    }
  }
  
  const config = getSpeakerConfig(entry.speaker)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-2", config.align)}
    >
      <div className={cn(
        "max-w-[80%] rounded-lg px-3 py-2 shadow-sm",
        config.color
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-90">
            {config.label}
          </span>
          {entry.speaker === 'ai' && (
            <Brain className="h-3 w-3 opacity-75" />
          )}
          {entry.speaker === 'contact' && (
            <User className="h-3 w-3 opacity-75" />
          )}
        </div>
        
        <p className="text-sm leading-relaxed">{entry.text}</p>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs opacity-70">
            {entry.timestamp.toLocaleTimeString()}
          </span>
          
          {entry.sentiment !== undefined && (
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 opacity-70" />
              <span className="text-xs opacity-70">
                {Math.round(entry.sentiment * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function AISuggestions({ suggestions }: { suggestions: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t bg-gradient-to-r from-blue-50/50 to-purple-50/50"
    >
      <div className="px-4 py-2 border-b bg-blue-50/50">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <Brain className="h-4 w-4" />
          AI Suggestions
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full text-left p-2 rounded-lg bg-white/80 hover:bg-white transition-colors text-sm border border-blue-100 hover:border-blue-200"
            onClick={() => {
              // Handle suggestion click (e.g., copy to clipboard or send to AI)
              navigator.clipboard.writeText(suggestion)
            }}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

function CallControls({ 
  isMuted, 
  onMuteToggle, 
  onEndCall, 
  callStatus 
}: {
  isMuted: boolean
  onMuteToggle: () => void
  onEndCall: () => void
  callStatus: CallStatus
}) {
  const isCallActive = ['connected', 'ringing'].includes(callStatus)
  
  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            onClick={onMuteToggle}
            disabled={!isCallActive}
            className="h-10 w-10"
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10"
            disabled={!isCallActive}
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={onEndCall}
          disabled={callStatus === 'ended'}
          className="gap-2"
        >
          <PhoneOff className="h-4 w-4" />
          End Call
        </Button>
      </div>
    </div>
  )
}