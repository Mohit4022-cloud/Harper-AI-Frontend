import { StateCreator } from 'zustand'
import { ContactId, Contact } from '@/types/brand'

export interface ContactFilters {
  search?: string
  tags?: string[]
  leadStatus?: string[]
  assignedToId?: string
  dateRange?: { start: Date; end: Date }
  leadScoreRange?: { min: number; max: number }
}

export interface ContactSlice {
  // State
  contacts: Contact[]
  selectedContacts: Set<ContactId>
  searchQuery: string
  filters: ContactFilters
  isLoading: boolean
  error: string | null

  // Actions
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: ContactId, updates: Partial<Contact>) => void
  deleteContacts: (ids: ContactId[]) => void
  
  // Selection
  selectContact: (id: ContactId) => void
  selectAll: () => void
  clearSelection: () => void
  
  // Filtering
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<ContactFilters>) => void
  clearFilters: () => void
  
  // Loading states
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Optimistic updates
  optimisticUpdate: <T>(
    update: () => void,
    rollback: () => void,
    asyncAction: () => Promise<T>
  ) => Promise<T>
  
  // Computed values
  getFilteredContacts: () => Contact[]
  getSelectedCount: () => number
}

export const createContactSlice: StateCreator<ContactSlice> = (set, get) => ({
  // Initial state
  contacts: [],
  selectedContacts: new Set(),
  searchQuery: '',
  filters: {},
  isLoading: false,
  error: null,

  // Contact management
  setContacts: (contacts) => set({ contacts, error: null }),
  
  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts, contact],
    error: null
  })),
  
  updateContact: (id, updates) => set((state) => ({
    contacts: state.contacts.map(c =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
    ),
    error: null
  })),
  
  deleteContacts: (ids) => set((state) => ({
    contacts: state.contacts.filter(c => !ids.includes(c.id)),
    selectedContacts: new Set(
      Array.from(state.selectedContacts).filter(id => !ids.includes(id))
    ),
    error: null
  })),

  // Selection management
  selectContact: (id) => set((state) => {
    const newSelection = new Set(state.selectedContacts)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    return { selectedContacts: newSelection }
  }),

  selectAll: () => set((state) => ({
    selectedContacts: new Set(state.contacts.map(c => c.id))
  })),

  clearSelection: () => set({ selectedContacts: new Set() }),

  // Filtering
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  clearFilters: () => set({ filters: {}, searchQuery: '' }),

  // Loading states
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Optimistic updates
  optimisticUpdate: async (update, rollback, asyncAction) => {
    update()
    try {
      const result = await asyncAction()
      return result
    } catch (error) {
      rollback()
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  // Computed values
  getFilteredContacts: () => {
    const state = get()
    let filtered = [...state.contacts]

    // Apply search
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(contact =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.phone.includes(query)
      )
    }

    // Apply filters
    if (state.filters.tags?.length) {
      filtered = filtered.filter(contact =>
        state.filters.tags!.some(tag => contact.tags.includes(tag))
      )
    }

    if (state.filters.leadStatus?.length) {
      filtered = filtered.filter(contact =>
        state.filters.leadStatus!.includes(contact.leadStatus)
      )
    }

    if (state.filters.assignedToId) {
      filtered = filtered.filter(contact =>
        contact.assignedToId === state.filters.assignedToId
      )
    }

    if (state.filters.leadScoreRange) {
      const { min, max } = state.filters.leadScoreRange
      filtered = filtered.filter(contact =>
        contact.leadScore >= min && contact.leadScore <= max
      )
    }

    return filtered
  },

  getSelectedCount: () => get().selectedContacts.size,
})