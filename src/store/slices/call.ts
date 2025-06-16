import { StateCreator } from 'zustand'
import { CallId, ContactId, UserId } from '@/types/brand'

export interface ActiveCall {
  id: CallId
  contactId: ContactId
  userId: UserId
  startTime: Date
  status: 'connecting' | 'connected' | 'ending' | 'ended'
  isMuted: boolean
  isRecording: boolean
  duration: number
}

export interface CallTranscript {
  speaker: 'agent' | 'contact' | 'ai'
  text: string
  timestamp: Date
  sentiment?: number
}

export interface CallHistory {
  id: CallId
  contactId: ContactId
  userId: UserId
  startTime: Date
  endTime: Date
  duration: number
  status: 'completed' | 'missed' | 'failed'
  transcript?: CallTranscript[]
  recordingUrl?: string
  sentiment?: number
  summary?: string
  nextSteps?: string[]
}

export interface CallSlice {
  // State
  activeCall: ActiveCall | null
  callHistory: CallHistory[]
  transcript: CallTranscript[]
  aiSuggestions: string[]
  
  // Call management
  startCall: (contactId: ContactId) => void
  endCall: () => void
  setCallStatus: (status: ActiveCall['status']) => void
  toggleMute: () => void
  toggleRecording: () => void
  updateCallDuration: (duration: number) => void
  
  // Transcript management
  addTranscriptEntry: (entry: CallTranscript) => void
  clearTranscript: () => void
  
  // AI features
  addAISuggestion: (suggestion: string) => void
  clearAISuggestions: () => void
  
  // History
  addCallToHistory: (call: CallHistory) => void
  getCallsForContact: (contactId: ContactId) => CallHistory[]
  getRecentCalls: (limit?: number) => CallHistory[]
}

export const createCallSlice: StateCreator<CallSlice> = (set, get) => ({
  // Initial state
  activeCall: null,
  callHistory: [],
  transcript: [],
  aiSuggestions: [],

  // Call management
  startCall: (contactId) => {
    const callId = `call-${Date.now()}` as CallId
    const userId = 'current-user' as UserId // This would come from auth
    
    set({
      activeCall: {
        id: callId,
        contactId,
        userId,
        startTime: new Date(),
        status: 'connecting',
        isMuted: false,
        isRecording: true,
        duration: 0,
      },
      transcript: [],
      aiSuggestions: [],
    })
  },

  endCall: () => {
    const { activeCall, transcript } = get()
    if (!activeCall) return

    const endTime = new Date()
    const callHistory: CallHistory = {
      id: activeCall.id,
      contactId: activeCall.contactId,
      userId: activeCall.userId,
      startTime: activeCall.startTime,
      endTime,
      duration: activeCall.duration,
      status: 'completed',
      transcript: [...transcript],
      sentiment: calculateAverageSentiment(transcript),
    }

    set((state) => ({
      activeCall: null,
      callHistory: [...state.callHistory, callHistory],
      transcript: [],
      aiSuggestions: [],
    }))
  },

  setCallStatus: (status) => set((state) => ({
    activeCall: state.activeCall ? { ...state.activeCall, status } : null
  })),

  toggleMute: () => set((state) => ({
    activeCall: state.activeCall 
      ? { ...state.activeCall, isMuted: !state.activeCall.isMuted }
      : null
  })),

  toggleRecording: () => set((state) => ({
    activeCall: state.activeCall 
      ? { ...state.activeCall, isRecording: !state.activeCall.isRecording }
      : null
  })),

  updateCallDuration: (duration) => set((state) => ({
    activeCall: state.activeCall 
      ? { ...state.activeCall, duration }
      : null
  })),

  // Transcript management
  addTranscriptEntry: (entry) => set((state) => ({
    transcript: [...state.transcript, entry]
  })),

  clearTranscript: () => set({ transcript: [] }),

  // AI features
  addAISuggestion: (suggestion) => set((state) => ({
    aiSuggestions: [...state.aiSuggestions, suggestion].slice(-5) // Keep last 5
  })),

  clearAISuggestions: () => set({ aiSuggestions: [] }),

  // History
  addCallToHistory: (call) => set((state) => ({
    callHistory: [...state.callHistory, call]
  })),

  getCallsForContact: (contactId) => {
    return get().callHistory.filter(call => call.contactId === contactId)
  },

  getRecentCalls: (limit = 10) => {
    return get().callHistory
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
      .slice(0, limit)
  },
})

// Helper function
function calculateAverageSentiment(transcript: CallTranscript[]): number {
  const sentiments = transcript
    .map(t => t.sentiment)
    .filter((s): s is number => s !== undefined)
  
  if (sentiments.length === 0) return 0
  
  return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
}