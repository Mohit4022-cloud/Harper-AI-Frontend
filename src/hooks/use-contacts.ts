import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { contactKeys } from '@/lib/query-client'
import { useAppStore } from '@/store'
import { Contact, ContactId, ContactFilters } from '@/types/brand'

export function useInfiniteContacts(filters: ContactFilters = {}) {
  return useInfiniteQuery({
    queryKey: contactKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/contacts/v2?page=${pageParam}&limit=50`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for contact lists
  })
}

export function useContact(id: ContactId) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/contacts/v2/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useContactSearch(query: string) {
  return useQuery({
    queryKey: contactKeys.search(query),
    queryFn: async () => {
      const response = await fetch(`/api/contacts/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds for search results
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const addContact = useAppStore(state => state.addContact)
  
  return useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/contacts/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    },
    onMutate: async (newContact) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() })
      
      // Optimistically update Zustand store
      const optimisticContact: Contact = {
        ...newContact,
        id: `temp-${Date.now()}` as ContactId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      addContact(optimisticContact)
      
      return { optimisticContact }
    },
    onSuccess: (data, variables, context) => {
      // Update Zustand with real data
      const updateContact = useAppStore.getState().updateContact
      if (context?.optimisticContact) {
        // Remove optimistic contact and add real one
        const deleteContact = useAppStore.getState().deleteContact
        deleteContact(context.optimisticContact.id)
        addContact(data)
      }
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contactKeys.stats() })
    },
    onError: (error, variables, context) => {
      // Remove optimistic update on error
      if (context?.optimisticContact) {
        const deleteContact = useAppStore.getState().deleteContact
        deleteContact(context.optimisticContact.id)
      }
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const updateContact = useAppStore(state => state.updateContact)
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: ContactId; updates: Partial<Contact> }) => {
      const response = await fetch(`/api/contacts/v2/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.detail(id) })
      
      // Snapshot the previous value
      const previousContact = queryClient.getQueryData(contactKeys.detail(id))
      
      // Optimistically update both React Query and Zustand
      queryClient.setQueryData(contactKeys.detail(id), (old: Contact) => ({
        ...old,
        ...updates,
        updatedAt: new Date(),
      }))
      
      updateContact(id, { ...updates, updatedAt: new Date() })
      
      return { previousContact, id }
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic updates
      if (context?.previousContact) {
        queryClient.setQueryData(contactKeys.detail(id), context.previousContact)
        updateContact(id, context.previousContact as Partial<Contact>)
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}

export function useDeleteContacts() {
  const queryClient = useQueryClient()
  const deleteContacts = useAppStore(state => state.deleteContacts)
  
  return useMutation({
    mutationFn: async (ids: ContactId[]) => {
      const response = await fetch('/api/contacts/v2/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    },
    onMutate: async (ids) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() })
      
      // Snapshot the previous contacts
      const previousContacts = useAppStore.getState().contacts.filter(c => ids.includes(c.id))
      
      // Optimistically remove contacts
      deleteContacts(ids)
      
      return { previousContacts, ids }
    },
    onError: (error, ids, context) => {
      // Rollback by re-adding the contacts
      if (context?.previousContacts) {
        const addContact = useAppStore.getState().addContact
        context.previousContacts.forEach(contact => addContact(contact))
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}

export function useBulkUpdateContacts() {
  const queryClient = useQueryClient()
  const updateContact = useAppStore(state => state.updateContact)
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: ContactId[]; updates: Partial<Contact> }) => {
      const response = await fetch('/api/contacts/v2/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    },
    onMutate: async ({ ids, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() })
      
      // Snapshot previous values
      const previousContacts = useAppStore.getState().contacts
        .filter(c => ids.includes(c.id))
        .map(c => ({ id: c.id, data: { ...c } }))
      
      // Optimistically update all contacts
      ids.forEach(id => {
        updateContact(id, { ...updates, updatedAt: new Date() })
      })
      
      return { previousContacts, ids }
    },
    onError: (error, { ids }, context) => {
      // Rollback optimistic updates
      if (context?.previousContacts) {
        context.previousContacts.forEach(({ id, data }) => {
          updateContact(id, data)
        })
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}