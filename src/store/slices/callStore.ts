import { create } from 'zustand'
import { Call, CallStatus, Contact } from '@/types'

interface CallState {
  currentCall: Call | null
  isDialerOpen: boolean
  isMuted: boolean
  isOnHold: boolean
  callHistory: Call[]
  twilioDevice: any
  isDeviceReady: boolean
  
  // Actions
  setCurrentCall: (call: Call | null) => void
  updateCallStatus: (status: CallStatus) => void
  toggleMute: () => void
  toggleHold: () => void
  openDialer: () => void
  closeDialer: () => void
  setTwilioDevice: (device: any) => void
  setDeviceReady: (ready: boolean) => void
  addToCallHistory: (call: Call) => void
  endCall: () => void
}

export const useCallStore = create<CallState>((set, get) => ({
  currentCall: null,
  isDialerOpen: false,
  isMuted: false,
  isOnHold: false,
  callHistory: [],
  twilioDevice: null,
  isDeviceReady: false,

  setCurrentCall: (call: Call | null) => {
    set({ currentCall: call })
  },

  updateCallStatus: (status: CallStatus) => {
    const { currentCall } = get()
    if (currentCall) {
      set({
        currentCall: { ...currentCall, status },
      })
    }
  },

  toggleMute: () => {
    const { isMuted, twilioDevice } = get()
    
    if (twilioDevice && twilioDevice.activeConnection) {
      twilioDevice.activeConnection.mute(!isMuted)
    }
    
    set({ isMuted: !isMuted })
  },

  toggleHold: () => {
    set({ isOnHold: !get().isOnHold })
  },

  openDialer: () => {
    set({ isDialerOpen: true })
  },

  closeDialer: () => {
    set({ isDialerOpen: false })
  },

  setTwilioDevice: (device: any) => {
    set({ twilioDevice: device })
  },

  setDeviceReady: (ready: boolean) => {
    set({ isDeviceReady: ready })
  },

  addToCallHistory: (call: Call) => {
    const { callHistory } = get()
    set({
      callHistory: [call, ...callHistory.slice(0, 99)], // Keep last 100 calls
    })
  },

  endCall: () => {
    const { currentCall, twilioDevice } = get()
    
    if (twilioDevice && twilioDevice.activeConnection) {
      twilioDevice.activeConnection.disconnect()
    }
    
    if (currentCall) {
      const endedCall = {
        ...currentCall,
        status: 'completed' as CallStatus,
        endedAt: new Date(),
      }
      
      get().addToCallHistory(endedCall)
    }
    
    set({
      currentCall: null,
      isMuted: false,
      isOnHold: false,
    })
  },
}))