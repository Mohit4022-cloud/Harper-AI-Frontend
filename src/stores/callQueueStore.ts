import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Contact } from '@/lib/mockContacts'

export interface CallRecord {
  id: string
  contactId: string
  contactName: string
  contactCompany: string
  phone: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: 'queued' | 'ringing' | 'connected' | 'failed' | 'completed'
  transcript?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  notes?: string
}

interface CallQueueState {
  // Queue management
  queue: Contact[]
  currentIndex: number
  activeCall: CallRecord | null
  isPaused: boolean
  isAutoDialing: boolean
  
  // Call history
  callHistory: CallRecord[]
  
  // Transcript
  currentTranscript: string[]
  
  // Actions
  setQueue: (contacts: Contact[]) => void
  addToQueue: (contacts: Contact[]) => void
  clearQueue: () => void
  nextInQueue: () => Contact | null
  skipCurrent: () => void
  
  // Call control
  startCall: (contact: Contact) => void
  endCall: (status: 'completed' | 'failed', duration?: number) => void
  pauseAutoDialing: () => void
  resumeAutoDialing: () => void
  toggleAutoDialing: () => void
  
  // Transcript
  addTranscriptLine: (line: string) => void
  clearTranscript: () => void
  
  // History
  getCallHistory: () => CallRecord[]
  clearHistory: () => void
}

export const useCallQueueStore = create<CallQueueState>()(
  persist(
    (set, get) => ({
      // Initial state
      queue: [],
      currentIndex: 0,
      activeCall: null,
      isPaused: false,
      isAutoDialing: false,
      callHistory: [],
      currentTranscript: [],
      
      // Queue actions
      setQueue: (contacts) => set({ 
        queue: contacts, 
        currentIndex: 0,
        isPaused: false 
      }),
      
      addToQueue: (contacts) => set((state) => ({ 
        queue: [...state.queue, ...contacts] 
      })),
      
      clearQueue: () => set({ 
        queue: [], 
        currentIndex: 0,
        isPaused: false,
        isAutoDialing: false 
      }),
      
      nextInQueue: () => {
        const state = get()
        if (state.currentIndex < state.queue.length) {
          const contact = state.queue[state.currentIndex]
          set({ currentIndex: state.currentIndex + 1 })
          return contact
        }
        return null
      },
      
      skipCurrent: () => {
        const state = get()
        if (state.activeCall) {
          get().endCall('failed', 0)
        }
        if (state.currentIndex < state.queue.length - 1) {
          set({ currentIndex: state.currentIndex + 1 })
        }
      },
      
      // Call control
      startCall: (contact) => {
        const callRecord: CallRecord = {
          id: `call-${Date.now()}`,
          contactId: contact.id,
          contactName: contact.name,
          contactCompany: contact.company,
          phone: contact.phone,
          startTime: new Date(),
          status: 'ringing',
          transcript: [],
        }
        set({ 
          activeCall: callRecord,
          currentTranscript: []
        })
      },
      
      endCall: (status, duration) => {
        const state = get()
        if (state.activeCall) {
          const completedCall: CallRecord = {
            ...state.activeCall,
            endTime: new Date(),
            duration: duration || 0,
            status,
            transcript: [...state.currentTranscript],
          }
          set((state) => ({
            activeCall: null,
            callHistory: [completedCall, ...state.callHistory],
            currentTranscript: []
          }))
        }
      },
      
      pauseAutoDialing: () => set({ isPaused: true }),
      resumeAutoDialing: () => set({ isPaused: false }),
      toggleAutoDialing: () => set((state) => ({ 
        isAutoDialing: !state.isAutoDialing 
      })),
      
      // Transcript
      addTranscriptLine: (line) => set((state) => ({
        currentTranscript: [...state.currentTranscript, line]
      })),
      
      clearTranscript: () => set({ currentTranscript: [] }),
      
      // History
      getCallHistory: () => get().callHistory,
      clearHistory: () => set({ callHistory: [] }),
    }),
    {
      name: 'call-queue-storage',
      partialize: (state) => ({
        callHistory: state.callHistory.slice(0, 100), // Keep only last 100 calls
      }),
    }
  )
)