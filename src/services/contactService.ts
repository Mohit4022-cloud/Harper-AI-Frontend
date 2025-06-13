import axios from 'axios'
import { Contact, PaginatedResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

const contactApi = axios.create({
  baseURL: `${API_BASE_URL}/contacts`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
contactApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage or auth store
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle API responses
contactApi.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success) {
      return { 
        ...response, 
        data: response.data.data, 
        pagination: response.data.pagination 
      } as any  // Type assertion to fix TS error
    }
    return response
  },
  (error) => {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw error
  }
)

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