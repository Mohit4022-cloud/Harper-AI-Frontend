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
  setActiveCall: (call) => set((state) => {
    state.activeCall = call
  }),
  
  updateActiveCall: (updates) => set((state) => {
    if (state.activeCall) {
      state.activeCall = { ...state.activeCall, ...updates }
    }
  }),
  
  addToHistory: (call) => set((state) => {
    state.callHistory.unshift(call)
    // Keep only last 100 calls in memory
    if (state.callHistory.length > 100) {
      state.callHistory = state.callHistory.slice(0, 100)
    }
  }),
  
  setInitiatingCall: (isInitiating) => set((state) => {
    state.isInitiatingCall = isInitiating
  }),
  
  setCallError: (error) => set((state) => {
    state.callError = error
  }),
  
  // Call management
  startCall: async (contactId) => {
    set((state) => {
      state.isInitiatingCall = true
      state.callError = null
    })
    
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
      
      set((state) => {
        state.activeCall = call
        state.isInitiatingCall = false
      })
    } catch (error) {
      set((state) => {
        state.callError = error instanceof Error ? error.message : 'Failed to start call'
        state.isInitiatingCall = false
      })
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
      
      set((state) => {
        state.activeCall = null
        state.callHistory.unshift(endedCall)
      })
    } catch (error) {
      set((state) => {
        state.callError = error instanceof Error ? error.message : 'Failed to end call'
      })
      throw error
    }
  },
  
  updateCallStatus: (status) => set((state) => {
    if (state.activeCall) {
      state.activeCall.status = status
    }
  }),
  
  addTranscriptEntry: (entry) => set((state) => {
    if (state.activeCall) {
      if (!state.activeCall.transcript) {
        state.activeCall.transcript = []
      }
      state.activeCall.transcript.push(entry)
    }
  }),
  
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