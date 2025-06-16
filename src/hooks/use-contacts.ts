import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, mutationKeys } from '@/lib/query-client'
import { useAppStore } from '@/store'
import { Contact, ContactId } from '@/types/brand'
import { ContactFilters } from '@/store/slices/contact'

// API response types
interface ContactsResponse {
  contacts: Contact[]
  nextCursor?: number
  totalCount: number
  hasNextPage: boolean
}

interface CreateContactPayload {
  firstName: string
  lastName: string
  email?: string
  phone: string
  company?: string
  tags?: string[]
}

interface UpdateContactPayload extends Partial<CreateContactPayload> {
  leadStatus?: Contact['leadStatus']
  leadScore?: number
  customFields?: Record<string, any>
}

// Infinite query for contacts list with virtual scrolling
export function useInfiniteContacts(filters: ContactFilters) {
  const setContacts = useAppStore(state => state.setContacts)
  
  return useInfiniteQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/contacts?page=${pageParam}&limit=50`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      
      if (!response.ok) throw new Error('Failed to fetch contacts')
      
      const data: ContactsResponse = await response.json()
      
      // Update store with new contacts
      if (pageParam === 0) {
        setContacts(data.contacts)
      }
      
      return data
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  })
}

// Single contact query
export function useContact(id: ContactId) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${id}`)
      if (!response.ok) throw new Error('Failed to fetch contact')
      return response.json() as Promise<Contact>
    },
    enabled: !!id,
  })
}

// Contact enrichment query
export function useContactEnrichment(id: ContactId, enabled = false) {
  return useQuery({
    queryKey: queryKeys.contacts.enrichment(id),
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${id}/enrich`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to enrich contact')
      return response.json()
    },
    enabled: enabled && !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient()
  const { addContact, addNotification } = useAppStore()

  return useMutation({
    mutationKey: mutationKeys.contacts.create,
    mutationFn: async (payload: CreateContactPayload) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) throw new Error('Failed to create contact')
      
      return response.json() as Promise<Contact>
    },
    onSuccess: (newContact) => {
      // Update store
      addContact(newContact)
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
      
      // Show notification
      addNotification({
        type: 'success',
        title: 'Contact created',
        message: `${newContact.firstName} ${newContact.lastName} has been added`,
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to create contact',
        message: error instanceof Error ? error.message : 'An error occurred',
      })
    },
  })
}

// Update contact mutation with optimistic updates
export function useUpdateContact() {
  const queryClient = useQueryClient()
  const { updateContact, addNotification, optimisticUpdate } = useAppStore()

  return useMutation({
    mutationKey: mutationKeys.contacts.update,
    mutationFn: async ({ id, updates }: { id: ContactId; updates: UpdateContactPayload }) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) throw new Error('Failed to update contact')
      
      return response.json() as Promise<Contact>
    },
    onMutate: async ({ id, updates }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.detail(id) })
      
      // Snapshot previous value
      const previousContact = queryClient.getQueryData<Contact>(
        queryKeys.contacts.detail(id)
      )
      
      // Optimistic update
      const optimisticContact = previousContact 
        ? { ...previousContact, ...updates, updatedAt: new Date() }
        : null
      
      if (optimisticContact) {
        queryClient.setQueryData(queryKeys.contacts.detail(id), optimisticContact)
        updateContact(id, updates)
      }
      
      return { previousContact }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousContact) {
        queryClient.setQueryData(
          queryKeys.contacts.detail(id),
          context.previousContact
        )
        updateContact(id, context.previousContact)
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to update contact',
        message: err instanceof Error ? err.message : 'An error occurred',
      })
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
    },
    onSuccess: (updatedContact) => {
      addNotification({
        type: 'success',
        title: 'Contact updated',
        message: `${updatedContact.firstName} ${updatedContact.lastName} has been updated`,
      })
    },
  })
}

// Bulk operations
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient()
  const { deleteContacts, clearSelection, addNotification } = useAppStore()

  return useMutation({
    mutationKey: mutationKeys.contacts.bulkDelete,
    mutationFn: async (ids: ContactId[]) => {
      const response = await fetch('/api/contacts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      
      if (!response.ok) throw new Error('Failed to delete contacts')
      
      return response.json()
    },
    onMutate: async (ids) => {
      // Optimistic update
      deleteContacts(ids)
      clearSelection()
    },
    onSuccess: (data, ids) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
      
      addNotification({
        type: 'success',
        title: 'Contacts deleted',
        message: `Successfully deleted ${ids.length} contacts`,
      })
    },
    onError: (error) => {
      // Rollback would require storing previous state
      addNotification({
        type: 'error',
        title: 'Failed to delete contacts',
        message: error instanceof Error ? error.message : 'An error occurred',
      })
      
      // Refetch to restore correct state
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() })
    },
  })
}

// Import contacts
export function useImportContacts() {
  const queryClient = useQueryClient()
  const { addNotification, setGlobalLoading } = useAppStore()

  return useMutation({
    mutationKey: mutationKeys.contacts.import,
    mutationFn: async (file: File) => {
      setGlobalLoading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Failed to import contacts')
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
      
      addNotification({
        type: 'success',
        title: 'Import successful',
        message: `Imported ${data.count} contacts`,
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'An error occurred',
      })
    },
    onSettled: () => {
      setGlobalLoading(false)
    },
  })
}