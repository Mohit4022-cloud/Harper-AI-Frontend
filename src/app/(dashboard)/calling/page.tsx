'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneCall, Users, History, Settings, Sparkles, Upload, Phone } from 'lucide-react';
import Dialer from '@/app/calling/components/Dialer';
import TranscriptDisplay from '@/app/calling/components/TranscriptDisplay';
import CoachingCards from '@/app/calling/components/CoachingCards';
import CallAnalytics from '@/app/calling/components/CallAnalytics';
import CallHistory from '@/app/calling/components/CallHistory';

// New components
import { CSVUploader } from '@/components/calling/CSVUploader';
import { AutoDialer } from '@/components/calling/AutoDialer';
import { LiveTranscript } from '@/components/calling/LiveTranscript';
import { CallHistoryTable } from '@/components/calling/CallHistoryTable';
import { ContactsTable } from '@/components/calling/ContactsTable';
import { TestCallDialog } from '@/components/calling/TestCallDialog';

import { useCallStore } from '@/store/slices/callStore';
import { useCallQueueStore } from '@/store/slices/callQueueStore';
// import twilioService from '@/services/twilio/twilioService'; // TODO: Implement when Twilio service is ready
import TranscriptionService from '@/services/ai/transcriptionService';
import { TranscriptSegment } from '@/types/transcript';
import { CoachingCard, CallAnalytics as ICallAnalytics } from '@/types/advanced';
import { generateTranscript, generateCallInsights, generateCoachingSuggestions } from '@/lib/mockDataGenerators';

export default function CallingPage() {
  const [activeTab, setActiveTab] = useState('dialer');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [coachingCards, setCoachingCards] = useState<CoachingCard[]>([]);
  const [callAnalytics, setCallAnalytics] = useState<ICallAnalytics | null>(null);
  const [transcriptionService, setTranscriptionService] = useState<TranscriptionService | null>(null);
  const [twilioDevice, setTwilioDevice] = useState<any>(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);

  const { 
    activeCall, 
    addTranscriptLine, 
    queue,
    currentIndex 
  } = useCallQueueStore();

  // Initialize Twilio on component mount
  useEffect(() => {
    // TODO: Implement actual Twilio service when available
    setIsDeviceReady(false); // Keep in mock mode
    console.log('Running in mock mode - Twilio not configured');
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive && !isOnHold) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, isOnHold]);

  // Sync with auto-dialer state
  useEffect(() => {
    setIsCallActive(!!activeCall && activeCall.status === 'connected');
  }, [activeCall]);

  const handleCall = async (phoneNumber: string) => {
    try {
      // Call the mock API
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, contactId: 'mock-contact-001' })
      });
      
      const { data: callSession } = await response.json();
      
      setIsCallActive(true);
      setCallDuration(0);
      
      // Start simulating real-time transcription
      startMockTranscription();
      
      // Simulate dynamic coaching cards
      startCoachingSimulation();
      
      // Initialize mock analytics
      setCallAnalytics({
        sentimentAnalysis: {
          overall: {
            score: 0.2,
            magnitude: 0.7,
            label: 'positive'
          },
          timeline: [],
          customerSentiment: {
            score: 0.15,
            magnitude: 0.6,
            label: 'positive'
          },
          agentSentiment: {
            score: 0.25,
            magnitude: 0.8,
            label: 'positive'
          }
        },
        performanceScore: {
          overall: 75,
          categories: {
            discovery: 80,
            presentation: 70,
            objectionHandling: 75,
            closing: 65,
            rapport: 85
          }
        },
        talkRatio: 0.6,
        interruptionCount: 2,
        silencePercentage: 15,
        keywordsDetected: ['pricing', 'features', 'timeline', 'budget']
      });

    } catch (error) {
      console.error('Failed to make call:', error);
      setIsCallActive(false);
    }
  };
  
  const startMockTranscription = () => {
    const mockTranscript = generateTranscript();
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < mockTranscript.length && isCallActive) {
        const segment = mockTranscript[index];
        const transcriptLine = `${segment.role === 'agent' ? 'AI' : 'Prospect'}: ${segment.text}`;
        
        // Add to queue store for live transcript
        addTranscriptLine(transcriptLine);
        
        // Also update local state for backward compatibility
        setTranscriptSegments(prev => [...prev, {
          speaker: segment.role as 'agent' | 'customer',
          text: segment.text,
          startTime: Date.now() - (mockTranscript.length - index) * 3000,
          endTime: Date.now(),
          sentiment: {
            score: segment.sentiment === 'positive' ? 0.8 : segment.sentiment === 'negative' ? -0.8 : 0,
            magnitude: 0.5,
            label: segment.sentiment as 'positive' | 'neutral' | 'negative'
          }
        }]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000); // Add new segment every 3 seconds
    
    return () => clearInterval(interval);
  };
  
  const startCoachingSimulation = () => {
    const suggestions = generateCoachingSuggestions();
    let suggestionIndex = 0;
    
    const interval = setInterval(() => {
      if (suggestionIndex < suggestions.length && isCallActive) {
        const suggestion = suggestions[suggestionIndex];
        setCoachingCards(prev => [...prev, {
          id: `card-${Date.now()}`,
          type: suggestion.type as any,
          title: suggestion.title,
          content: suggestion.suggestion,
          priority: suggestion.priority as any,
          script: suggestion.script,
          triggerCondition: 'manual'
        }]);
        suggestionIndex++;
      } else {
        clearInterval(interval);
      }
    }, 15000); // New coaching card every 15 seconds
    
    return () => clearInterval(interval);
  };

  const handleEndCall = async () => {
    try {
      // TODO: await twilioService.endCall();
      
      if (transcriptionService) {
        await transcriptionService.stopTranscription();
        setTranscriptionService(null);
      }
      
      setIsCallActive(false);
      setIsMuted(false);
      setIsOnHold(false);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const handleToggleMute = async (muted: boolean) => {
    try {
      // TODO: await twilioService.muteCall(muted);
      setIsMuted(muted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleToggleHold = (onHold: boolean) => {
    setIsOnHold(onHold);
  };

  const updateTranscript = (segment: TranscriptSegment, isPartial: boolean) => {
    setTranscriptSegments(prev => {
      if (isPartial && prev.length > 0) {
        // Update the last segment if it's partial
        const last = prev[prev.length - 1];
        if (last.speaker === segment.speaker) {
          return [...prev.slice(0, -1), { ...segment, isPartial }];
        }
      }
      return [...prev, { ...segment, isPartial }];
    });
  };

  const updateAnalytics = (sentiment: any) => {
    // Update analytics based on sentiment data
    setCallAnalytics(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sentimentAnalysis: {
          ...prev.sentimentAnalysis,
          overall: {
            score: sentiment.score || 0,
            magnitude: sentiment.magnitude || 0.5,
            label: sentiment.label || 'neutral'
          }
        }
      };
    });
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            AI-Powered Calling
            <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Enhanced
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Make intelligent calls with real-time coaching and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCallActive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg animate-pulse">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 dark:text-red-400 font-medium">
                Call Active • {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Call Settings
          </Button>
        </div>
      </div>

      {/* Test Call Section */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Test Twilio + ElevenLabs Integration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Make a test call to verify your Twilio and ElevenLabs setup
            </p>
          </div>
          <TestCallDialog />
        </div>
      </Card>

      {/* CSV Uploader */}
      <CSVUploader />

      {/* Main Content - New Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Queue & Controls */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Auto Dialer */}
          <AutoDialer device={twilioDevice} isDeviceReady={isDeviceReady} />
          
          {/* Queue Info */}
          {queue.length > 0 && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">Call Queue</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {queue.slice(currentIndex, currentIndex + 5).map((contact, idx) => (
                  <div 
                    key={contact.id} 
                    className={`text-sm p-2 rounded ${idx === 0 ? 'bg-primary/10 font-medium' : ''}`}
                  >
                    <p>{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.company} • {contact.title}
                    </p>
                  </div>
                ))}
                {queue.length > currentIndex + 5 && (
                  <p className="text-xs text-muted-foreground">
                    ... and {queue.length - currentIndex - 5} more
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Center Column - Dialer & Transcript */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dialer">
                <PhoneCall className="h-4 w-4 mr-2" />
                Dialer
              </TabsTrigger>
              <TabsTrigger value="contacts">
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dialer" className="mt-4">
              <Dialer
                onCall={handleCall}
                onEndCall={handleEndCall}
                onToggleMute={handleToggleMute}
                onToggleHold={handleToggleHold}
                isCallActive={isCallActive}
                isMuted={isMuted}
                isOnHold={isOnHold}
              />
            </TabsContent>

            <TabsContent value="contacts">
              <ContactsTable />
            </TabsContent>

            <TabsContent value="history">
              <CallHistoryTable />
            </TabsContent>
          </Tabs>

          {/* Coaching Cards */}
          {isCallActive && coachingCards.length > 0 && (
            <CoachingCards
              cards={coachingCards}
              onDismiss={(cardId) => {
                setCoachingCards(prev => prev.filter(c => c.id !== cardId));
              }}
            />
          )}
        </div>

        {/* Right Column - Live Transcript & Analytics */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <LiveTranscript />
          
          <CallAnalytics
            analytics={callAnalytics}
            duration={callDuration}
            isRealTime={isCallActive}
          />
        </div>
      </div>
    </div>
  );
}