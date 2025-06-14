import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'

/**
 * Zod schema for contact validation
 */
export const ContactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  company: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Title is required'),
  industry: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'customer', 'churned']).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Contact = z.infer<typeof ContactSchema>

interface ContactsState {
  contacts: Contact[]
  loading: boolean
  error: string | null
  searchTerm: string
  selectedTags: string[]
  
  // Actions
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  getContact: (id: string) => Contact | undefined
  searchContacts: (term: string) => Contact[]
  setSearchTerm: (term: string) => void
  setSelectedTags: (tags: string[]) => void
  fetchContacts: () => Promise<void>
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  getTags: () => string[]
}

/**
 * Contacts store with persistence
 */
export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],
      loading: false,
      error: null,
      searchTerm: '',
      selectedTags: [],

      /**
       * Add a new contact
       */
      addContact: async (contactData) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          // Validate contact data
          const validatedData = ContactSchema.parse({
            ...contactData,
            id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: contactData.status || 'prospect',
            leadScore: contactData.leadScore || 50,
          })

          // Call API
          const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData),
          })

          if (!response.ok) {
            throw new Error('Failed to add contact')
          }

          const { data: newContact } = await response.json()

          // Update local state
          set((state) => ({
            contacts: [...state.contacts, newContact],
            loading: false,
          }))

          return newContact
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add contact'
          setError(errorMessage)
          setLoading(false)
          throw error
        }
      },

      /**
       * Update existing contact
       */
      updateContact: async (id, updates) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString(),
          }

          const response = await fetch(`/api/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          })

          if (!response.ok) {
            throw new Error('Failed to update contact')
          }

          const { data: updatedContact } = await response.json()

          set((state) => ({
            contacts: state.contacts.map((contact) =>
              contact.id === id ? updatedContact : contact
            ),
            loading: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update contact'
          setError(errorMessage)
          setLoading(false)
          throw error
        }
      },

      /**
       * Delete contact
       */
      deleteContact: async (id) => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(`/api/contacts/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete contact')
          }

          set((state) => ({
            contacts: state.contacts.filter((contact) => contact.id !== id),
            loading: false,
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact'
          setError(errorMessage)
          setLoading(false)
          throw error
        }
      },

      /**
       * Get single contact by ID
       */
      getContact: (id) => {
        return get().contacts.find((contact) => contact.id === id)
      },

      /**
       * Search contacts
       */
      searchContacts: (term) => {
        const { contacts, selectedTags } = get()
        const searchLower = term.toLowerCase()

        return contacts.filter((contact) => {
          // Search filter
          const matchesSearch =
            !term ||
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email.toLowerCase().includes(searchLower) ||
            contact.company.toLowerCase().includes(searchLower) ||
            contact.title.toLowerCase().includes(searchLower) ||
            (contact.industry && contact.industry.toLowerCase().includes(searchLower))

          // Tag filter
          const matchesTags =
            selectedTags.length === 0 ||
            (contact.tags &&
              selectedTags.every((tag) => contact.tags?.includes(tag)))

          return matchesSearch && matchesTags
        })
      },

      /**
       * Set search term
       */
      setSearchTerm: (term) => set({ searchTerm: term }),

      /**
       * Set selected tags for filtering
       */
      setSelectedTags: (tags) => set({ selectedTags: tags }),

      /**
       * Fetch all contacts from API
       */
      fetchContacts: async () => {
        const { setLoading, setError } = get()
        setLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/contacts')
          if (!response.ok) {
            throw new Error('Failed to fetch contacts')
          }

          const { data: contacts } = await response.json()
          set({ contacts, loading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contacts'
          setError(errorMessage)
          setLoading(false)
        }
      },

      /**
       * Set error message
       */
      setError: (error) => set({ error }),

      /**
       * Set loading state
       */
      setLoading: (loading) => set({ loading }),

      /**
       * Get all unique tags from contacts
       */
      getTags: () => {
        const { contacts } = get()
        const tagSet = new Set<string>()
        
        contacts.forEach((contact) => {
          contact.tags?.forEach((tag) => tagSet.add(tag))
        })
        
        return Array.from(tagSet).sort()
      },
    }),
    {
      name: 'contacts-storage',
      partialize: (state) => ({
        contacts: state.contacts,
      }),
    }
  )
)