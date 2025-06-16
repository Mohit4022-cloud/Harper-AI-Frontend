import { StateCreator } from 'zustand'
import { CallId, ContactId, Call, CallStatus, TranscriptEntry } from '@/types/brand'

export interface CallSlice {
  // State
  activeCall: Call | null
  callHistory: Call[]
  isInitiatingCall: boolean
  callError: string | null
  
  // Actions
  setActiveCall: (call: Call | null) => void
  updateActiveCall: (updates: Partial<Call>) => void
  addToHistory: (call: Call) => void
  setInitiatingCall: (isInitiating: boolean) => void
  setCallError: (error: string | null) => void
  
  // Call management
  startCall: (contactId: ContactId) => Promise<void>
  endCall: () => Promise<void>
  updateCallStatus: (status: CallStatus) => void
  addTranscriptEntry: (entry: TranscriptEntry) => void
  
  // Computed
  getCallById: (id: CallId) => Call | undefined
  getCallsForContact: (contactId: ContactId) => Call[]
  getActiveCallDuration: () => number
}

export const createCallSlice: StateCreator<CallSlice, [], [], CallSlice> = (set, get) => ({
  // Initial state
  activeCall: null,
  callHistory: [],
  isInitiatingCall: false,
  callError: null,
  
  // Actions
  setActiveCall: (call) => set((state) => ({
    ...state,
    activeCall: call
  })),
  
  updateActiveCall: (updates) => set((state) => ({
    ...state,
    activeCall: state.activeCall ? { ...state.activeCall, ...updates } : null
  })),
  
  addToHistory: (call) => set((state) => {
    const newHistory = [call, ...state.callHistory]
    return {
      ...state,
      callHistory: newHistory.length > 100 ? newHistory.slice(0, 100) : newHistory
    }
  }),
  
  setInitiatingCall: (isInitiating) => set((state) => ({
    ...state,
    isInitiatingCall: isInitiating
  })),
  
  setCallError: (error) => set((state) => ({
    ...state,
    callError: error
  })),
  
  // Call management
  startCall: async (contactId) => {
    set((state) => ({
      ...state,
      isInitiatingCall: true,
      callError: null
    }))
    
    try {
      const response = await fetch('/api/call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to start call')
      }
      
      const { call } = await response.json()
      
      set((state) => ({
        ...state,
        activeCall: call,
        isInitiatingCall: false
      }))
    } catch (error) {
      set((state) => ({
        ...state,
        callError: error instanceof Error ? error.message : 'Failed to start call',
        isInitiatingCall: false
      }))
      throw error
    }
  },
  
  endCall: async () => {
    const { activeCall } = get()
    if (!activeCall) return
    
    try {
      await fetch('/api/call/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCall.id }),
      })
      
      const endedCall = {
        ...activeCall,
        endTime: new Date(),
        status: 'ended' as CallStatus,
      }
      
      set((state) => ({
        ...state,
        activeCall: null,
        callHistory: [endedCall, ...state.callHistory]
      }))
    } catch (error) {
      set((state) => ({
        ...state,
        callError: error instanceof Error ? error.message : 'Failed to end call'
      }))
      throw error
    }
  },
  
  updateCallStatus: (status) => set((state) => ({
    ...state,
    activeCall: state.activeCall ? { ...state.activeCall, status } : null
  })),
  
  addTranscriptEntry: (entry) => set((state) => ({
    ...state,
    activeCall: state.activeCall ? {
      ...state.activeCall,
      transcript: [...(state.activeCall.transcript || []), entry]
    } : null
  })),
  
  // Computed
  getCallById: (id) => {
    const { callHistory, activeCall } = get()
    if (activeCall?.id === id) return activeCall
    return callHistory.find(call => call.id === id)
  },
  
  getCallsForContact: (contactId) => {
    const { callHistory, activeCall } = get()
    const calls = callHistory.filter(call => call.contactId === contactId)
    if (activeCall?.contactId === contactId) {
      calls.unshift(activeCall)
    }
    return calls
  },
  
  getActiveCallDuration: () => {
    const { activeCall } = get()
    if (!activeCall?.startTime) return 0
    return Date.now() - activeCall.startTime.getTime()
  },
})