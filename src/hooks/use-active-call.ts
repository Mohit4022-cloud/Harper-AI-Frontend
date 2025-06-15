import { useAppStore } from '@/store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Call, CallId, ContactId } from '@/types/brand'
import { wsManager } from '@/lib/websocket'

export function useActiveCall() {
  const queryClient = useQueryClient()
  const activeCall = useAppStore(state => state.activeCall)
  const setActiveCall = useAppStore(state => state.setActiveCall)
  const updateActiveCall = useAppStore(state => state.updateActiveCall)
  
  // Start a new call
  const startCall = useMutation({
    mutationFn: async (contactId: ContactId) => {
      const response = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to start call')
      }
      
      return response.json() as Promise<Call>
    },
    onSuccess: (call) => {
      setActiveCall(call)
      
      // Emit WebSocket event
      wsManager.emit('call:started', {
        callId: call.id,
        contactId: call.contactId,
        userId: call.userId,
      })
      
      // Invalidate call queries
      queryClient.invalidateQueries({ queryKey: ['calls'] })
    },
  })
  
  // End the active call
  const endCall = useMutation({
    mutationFn: async () => {
      if (!activeCall) throw new Error('No active call')
      
      const response = await fetch(`/api/calls/${activeCall.id}/end`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to end call')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      if (activeCall) {
        // Emit WebSocket event
        wsManager.emit('call:ended', {
          callId: activeCall.id,
          duration: data.duration,
          userId: activeCall.userId,
        })
        
        // Add to call history
        useAppStore.getState().addToHistory({
          ...activeCall,
          endTime: new Date(),
          duration: data.duration,
          status: 'ended',
        })
      }
      
      setActiveCall(null)
      
      // Invalidate call queries
      queryClient.invalidateQueries({ queryKey: ['calls'] })
    },
  })
  
  // Mute/unmute call
  const toggleMute = useMutation({
    mutationFn: async (muted: boolean) => {
      if (!activeCall) throw new Error('No active call')
      
      const response = await fetch(`/api/calls/${activeCall.id}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muted }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle mute')
      }
      
      return muted
    },
    onSuccess: (muted) => {
      if (activeCall) {
        updateActiveCall({ isMuted: muted })
      }
    },
  })
  
  // Hold/unhold call
  const toggleHold = useMutation({
    mutationFn: async (onHold: boolean) => {
      if (!activeCall) throw new Error('No active call')
      
      const response = await fetch(`/api/calls/${activeCall.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onHold }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle hold')
      }
      
      return onHold
    },
    onSuccess: (onHold) => {
      if (activeCall) {
        updateActiveCall({ isOnHold: onHold })
      }
    },
  })
  
  // Transfer call
  const transferCall = useMutation({
    mutationFn: async (targetContactId: ContactId) => {
      if (!activeCall) throw new Error('No active call')
      
      const response = await fetch(`/api/calls/${activeCall.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetContactId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to transfer call')
      }
      
      return response.json()
    },
    onSuccess: () => {
      setActiveCall(null)
      queryClient.invalidateQueries({ queryKey: ['calls'] })
    },
  })
  
  return {
    activeCall,
    startCall: startCall.mutate,
    endCall: endCall.mutate,
    toggleMute: toggleMute.mutate,
    toggleHold: toggleHold.mutate,
    transferCall: transferCall.mutate,
    updateActiveCall,
    isStarting: startCall.isLoading,
    isEnding: endCall.isLoading,
  }
}

// Hook to fetch call details
export function useCall(callId: CallId | null) {
  return useQuery({
    queryKey: ['calls', callId],
    queryFn: async () => {
      if (!callId) return null
      
      const response = await fetch(`/api/calls/${callId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch call')
      }
      
      return response.json() as Promise<Call>
    },
    enabled: !!callId,
    staleTime: 5000, // 5 seconds
  })
}

// Hook to fetch call history
export function useCallHistory(filters?: {
  startDate?: Date
  endDate?: Date
  contactId?: ContactId
  status?: string
}) {
  return useQuery({
    queryKey: ['calls', 'history', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate.toISOString())
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate.toISOString())
      }
      if (filters?.contactId) {
        params.append('contactId', filters.contactId)
      }
      if (filters?.status) {
        params.append('status', filters.status)
      }
      
      const response = await fetch(`/api/calls/history?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch call history')
      }
      
      return response.json() as Promise<Call[]>
    },
    staleTime: 30000, // 30 seconds
  })
}