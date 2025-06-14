'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneCall, Users, History, Settings } from 'lucide-react';
import Dialer from '@/app/calling/components/Dialer';
import TranscriptDisplay from '@/app/calling/components/TranscriptDisplay';
import CoachingCards from '@/app/calling/components/CoachingCards';
import CallAnalytics from '@/app/calling/components/CallAnalytics';
import { useCallStore } from '@/stores/callStore';
import twilioService from '@/services/twilio/twilioService';
import TranscriptionService from '@/services/ai/transcriptionService';
import { TranscriptSegment, CoachingCard, CallAnalytics as ICallAnalytics } from '@/types/advanced';

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

  // Initialize Twilio on component mount
  useEffect(() => {
    const initializeTwilio = async () => {
      try {
        await twilioService.initialize();
        console.log('Twilio initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Twilio:', error);
      }
    };

    initializeTwilio();

    // Cleanup on unmount
    return () => {
      twilioService.destroy();
    };
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

  const handleCall = async (phoneNumber: string) => {
    try {
      const callSid = await twilioService.makeCall({
        to: phoneNumber,
        recordingEnabled: true,
        transcriptionEnabled: true,
      });

      setIsCallActive(true);
      setCallDuration(0);

      // Initialize real-time transcription
      if (process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_TRANSCRIPTION === 'true') {
        const service = new TranscriptionService({
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
          enableRealTime: true,
          enableSpeakerDiarization: true,
        });

        // Set up transcription event listeners
        service.on('partial', (event: any) => {
          if (event.segment) {
            updateTranscript(event.segment, true);
          }
        });

        service.on('final', (event: any) => {
          if (event.segment) {
            updateTranscript(event.segment, false);
          }
        });

        service.on('sentiment', (sentiment: any) => {
          updateAnalytics(sentiment);
        });

        setTranscriptionService(service);
        
        // Start transcription with a mock stream for now
        // In production, this would use the actual call audio stream
        const mockStream = new MediaStream();
        await service.startRealTimeTranscription(mockStream, callSid);
      }

      // Simulate coaching cards for demo
      setTimeout(() => {
        setCoachingCards([
          {
            id: '1',
            type: 'tip',
            title: 'Slow down your pace',
            content: 'You\'re speaking 180 words per minute. Try to slow down to 140-160 for better clarity.',
            priority: 'medium',
            triggerCondition: 'speaking_pace > 170',
          },
        ]);
      }, 5000);

    } catch (error) {
      console.error('Failed to make call:', error);
      setIsCallActive(false);
    }
  };

  const handleEndCall = async () => {
    try {
      await twilioService.endCall();
      
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
      await twilioService.muteCall(muted);
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
          return [...prev.slice(0, -1), segment];
        }
      }
      return [...prev, segment];
    });
  };

  const updateAnalytics = (sentiment: any) => {
    // Update analytics based on sentiment data
    setCallAnalytics(prev => ({
      ...prev!,
      sentimentAnalysis: {
        ...prev?.sentimentAnalysis!,
        overall: sentiment,
      },
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI-Powered Calling</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Make intelligent calls with real-time coaching and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Call Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Dialer and Controls */}
        <div className="lg:col-span-1 space-y-6">
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
              <Card className="p-6">
                <p className="text-center text-gray-500">Contact list coming soon</p>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="p-6">
                <p className="text-center text-gray-500">Call history coming soon</p>
              </Card>
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

        {/* Middle Column - Live Transcript */}
        <div className="lg:col-span-1">
          <TranscriptDisplay
            segments={transcriptSegments}
            isRealTime={isCallActive}
            showSentiment={true}
          />
        </div>

        {/* Right Column - Analytics */}
        <div className="lg:col-span-1">
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