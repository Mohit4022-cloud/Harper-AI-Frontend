'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Clock,
  Brain,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Pause,
  Play,
  SkipForward
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { Contact } from '@/types/brand'

interface TranscriptEntry {
  id: string
  speaker: 'agent' | 'contact'
  text: string
  timestamp: Date
  sentiment?: 'positive' | 'negative' | 'neutral'
  keywords?: string[]
}

interface AIInsight {
  id: string
  type: 'opportunity' | 'risk' | 'suggestion'
  title: string
  description: string
  timestamp: Date
}

// Voice visualization component
function VoiceVisualizer({ isActive, isMuted }: { isActive: boolean; isMuted: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode>()

  useEffect(() => {
    if (!isActive || isMuted) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Simulate audio visualization
    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      const bars = 50
      const barWidth = width / bars
      
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * height * 0.7
        const x = i * barWidth
        const y = (height - barHeight) / 2
        
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
        gradient.addColorStop(0, '#9333ea')
        gradient.addColorStop(1, '#ec4899')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth - 2, barHeight)
      }
      
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, isMuted])

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={60} 
      className="w-full h-full"
    />
  )
}

// Call timer component
function CallTimer({ startTime }: { startTime: Date }) {
  const [duration, setDuration] = useState('00:00')

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - startTime.getTime()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  return <span>{duration}</span>
}

// AI suggestion card
function AISuggestion({ suggestion }: { suggestion: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
        <p className="text-sm text-purple-800 dark:text-purple-200">{suggestion}</p>
      </div>
    </motion.div>
  )
}

export function AIVoiceInterface({ contact }: { contact: Contact }) {
  const { activeCall, endCall, setCallStatus } = useAppStore()
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [activeTab, setActiveTab] = useState('transcript')
  
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      id: '1',
      speaker: 'agent',
      text: "Hi Sarah, this is Alex from Harper AI. I noticed you've been exploring our enterprise solutions. Do you have a few minutes to discuss how we can help streamline your sales process?",
      timestamp: new Date(Date.now() - 30000),
      sentiment: 'positive',
      keywords: ['enterprise solutions', 'sales process']
    },
    {
      id: '2',
      speaker: 'contact',
      text: "Oh hi Alex! Yes, actually perfect timing. We've been struggling with our current CRM and looking for something more AI-powered.",
      timestamp: new Date(Date.now() - 20000),
      sentiment: 'positive',
      keywords: ['CRM', 'AI-powered']
    },
    {
      id: '3',
      speaker: 'agent',
      text: "That's great to hear! Many of our clients came from traditional CRMs. What specific challenges are you facing with your current system?",
      timestamp: new Date(Date.now() - 10000),
      sentiment: 'neutral',
      keywords: ['challenges', 'current system']
    }
  ])

  const [insights, setInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'opportunity',
      title: 'High Intent Signal',
      description: 'Contact mentioned struggling with current CRM - strong buying signal detected',
      timestamp: new Date(Date.now() - 15000)
    },
    {
      id: '2',
      type: 'suggestion',
      title: 'Next Best Action',
      description: 'Ask about team size and current monthly spend on CRM tools',
      timestamp: new Date(Date.now() - 5000)
    }
  ])

  const [currentSuggestion, setCurrentSuggestion] = useState(
    "Ask about their team size to better understand their needs"
  )

  // Simulate real-time transcript updates
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected' || isPaused) return

    const interval = setInterval(() => {
      const responses = [
        { speaker: 'contact' as const, text: "We have about 50 sales reps and our current CRM costs us around $5,000 per month" },
        { speaker: 'agent' as const, text: "I see. With Harper AI, you could reduce that cost by 40% while getting more advanced features" },
        { speaker: 'contact' as const, text: "That sounds interesting. Can you tell me more about the AI features?" },
        { speaker: 'agent' as const, text: "Absolutely! Our AI can automatically score leads, personalize outreach, and even handle initial conversations" },
      ]

      setTranscript(prev => {
        if (prev.length >= 10) return prev
        const nextResponse = responses[prev.length % responses.length]
        return [...prev, {
          id: Date.now().toString(),
          speaker: nextResponse.speaker,
          text: nextResponse.text,
          timestamp: new Date(),
          sentiment: 'positive' as const
        }]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [activeCall, isPaused])

  const handleEndCall = useCallback(() => {
    endCall()
  }, [endCall])

  const handleSkipSuggestion = useCallback(() => {
    const suggestions = [
      "Mention the free trial and implementation support",
      "Ask about their decision timeline",
      "Highlight the ROI from similar companies",
      "Suggest scheduling a demo with their team"
    ]
    setCurrentSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)])
  }, [])

  if (!activeCall) return null

  const isConnected = activeCall.status === 'connected'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Call Interface */}
      <div className="lg:col-span-2 space-y-6">
        {/* Call Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{contact.firstName[0]}{contact.lastName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{contact.firstName} {contact.lastName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{contact.company}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                      {activeCall.status}
                    </Badge>
                    {isConnected && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        <CallTimer startTime={activeCall.startTime} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className={isMuted ? 'text-red-600' : ''}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={!isSpeakerOn ? 'text-red-600' : ''}
                >
                  {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                {isConnected && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Voice Visualizer */}
            {isConnected && (
              <div className="mt-6 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <VoiceVisualizer isActive={!isPaused} isMuted={isMuted} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcript and Insights */}
        <Card className="flex-1">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transcript">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="transcript" className="mt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {transcript.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-3",
                          entry.speaker === 'agent' ? 'justify-start' : 'justify-end'
                        )}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          entry.speaker === 'agent' 
                            ? 'bg-gray-100 dark:bg-gray-800' 
                            : 'bg-purple-100 dark:bg-purple-900/30'
                        )}>
                          <p className="text-sm font-medium mb-1">
                            {entry.speaker === 'agent' ? 'Harper AI' : contact.firstName}
                          </p>
                          <p className="text-sm">{entry.text}</p>
                          {entry.keywords && (
                            <div className="flex gap-1 mt-2">
                              {entry.keywords.map(keyword => (
                                <Badge key={keyword} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {entry.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <Card key={insight.id} className={cn(
                      "border-l-4",
                      insight.type === 'opportunity' && "border-l-green-500",
                      insight.type === 'risk' && "border-l-red-500",
                      insight.type === 'suggestion' && "border-l-blue-500"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            insight.type === 'opportunity' && "bg-green-100 dark:bg-green-900/30",
                            insight.type === 'risk' && "bg-red-100 dark:bg-red-900/30",
                            insight.type === 'suggestion' && "bg-blue-100 dark:bg-blue-900/30"
                          )}>
                            {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {insight.type === 'risk' && <AlertCircle className="h-4 w-4 text-red-600" />}
                            {insight.type === 'suggestion' && <Brain className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{insight.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {insight.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {insight.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="space-y-6">
        {/* Live Suggestion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Next Best Action</p>
              <AISuggestion suggestion={currentSuggestion} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={handleSkipSuggestion}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip Suggestion
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sentiment Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '75%' }} />
                  </div>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Engagement Level</span>
                <Badge variant="outline" className="text-green-600">High</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Talk Ratio</span>
                <span className="text-sm font-medium">60:40</span>
              </div>
            </div>

            {/* Call Script */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Suggested Topics</p>
              <div className="space-y-2">
                {['ROI Calculator', 'Implementation Timeline', 'Integration Options', 'Pricing Plans'].map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-600">Lead Score</p>
              <p className="font-medium">{contact.leadScore}/100</p>
            </div>
            <div>
              <p className="text-gray-600">Last Contacted</p>
              <p className="font-medium">
                {contact.lastContactedAt 
                  ? new Date(contact.lastContactedAt).toLocaleDateString()
                  : 'First Contact'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Interactions</p>
              <p className="font-medium">{contact.interactions || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Tags</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {contact.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}