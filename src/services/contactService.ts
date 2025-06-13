import { Contact, PaginatedResponse } from '@/types'
import { createApiClient, addAuthInterceptor, addResponseInterceptor } from '@/lib/api'

// Create contacts API client with auth
const contactApi = createApiClient('contacts')
addAuthInterceptor(contactApi)
addResponseInterceptor(contactApi)

export const contactService = {
  async getContacts(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<PaginatedResponse<Contact>> {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)

    const response = await contactApi.get(`/?${searchParams.toString()}`)
    return {
      data: response.data,
      pagination: (response as any).pagination,
    }
  },

  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    const response = await contactApi.post('/', contactData)
    return response.data
  },

  async updateContact(id: string, contactData: Partial<Contact>): Promise<Contact> {
    const response = await contactApi.put(`/${id}`, contactData)
    return response.data
  },

  async deleteContact(id: string): Promise<void> {
    await contactApi.delete(`/${id}`)
  },

  async getContact(id: string): Promise<Contact> {
    const response = await contactApi.get(`/${id}`)
    return response.data
  },
}