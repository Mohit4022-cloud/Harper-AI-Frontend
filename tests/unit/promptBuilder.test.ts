import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildGeminiPrompt } from '@/lib/gemini/integration'

// Mock the email store
vi.mock('@/store/slices/emailStore', () => ({
  useEmailStore: {
    getState: vi.fn(),
  },
}))

describe('buildGeminiPrompt', () => {
  const mockContact = {
    id: 'test-123',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Test Corp',
    title: 'CEO',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should include tone setting in prompt', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'professional',
        length: 'medium',
        subjectStyle: 'question',
        cta: 'meeting',
        focusAreas: [],
        includeFeatures: [],
      },
    })

    const prompt = await buildGeminiPrompt(mockContact)
    expect(prompt).toContain('Tone: professional')
  })

  it('should include length setting in prompt', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'casual',
        length: 'short',
        subjectStyle: 'statement',
        cta: 'demo',
        focusAreas: [],
        includeFeatures: [],
      },
    })

    const prompt = await buildGeminiPrompt(mockContact)
    expect(prompt).toContain('Length: short')
  })

  it('should include subject style in prompt', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'friendly',
        length: 'long',
        subjectStyle: 'personalized',
        cta: 'trial',
        focusAreas: [],
        includeFeatures: [],
      },
    })

    const prompt = await buildGeminiPrompt(mockContact)
    expect(prompt).toContain('Subject Style: personalized')
  })

  it('should include CTA in prompt', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'executive',
        length: 'medium',
        subjectStyle: 'benefit',
        cta: 'custom',
        focusAreas: [],
        includeFeatures: [],
      },
    })

    const prompt = await buildGeminiPrompt(mockContact)
    expect(prompt).toContain('Call-to-Action: custom')
  })

  it('should include focus areas when present', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'professional',
        length: 'medium',
        subjectStyle: 'question',
        cta: 'meeting',
        focusAreas: ['cost-savings', 'efficiency'],
        includeFeatures: [],
      },
    })

    const prompt = await buildGeminiPrompt(mockContact)
    expect(prompt).toContain('Focus Areas: cost-savings, efficiency')
  })

  it('should include features when present', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'professional',
        length: 'medium',
        subjectStyle: 'question',
        cta: 'meeting',
        focusAreas: [],
        includeFeatures: ['analytics', 'automation'],
      },
    })

    const prompt = await buildGeminiPrompt(mockContact)
    expect(prompt).toContain('Include Features: analytics, automation')
  })

  it('should include custom instructions when provided', async () => {
    const { useEmailStore } = await import('@/store/slices/emailStore')
    useEmailStore.getState.mockReturnValue({
      settings: {
        tone: 'professional',
        length: 'medium',
        subjectStyle: 'question',
        cta: 'meeting',
        focusAreas: [],
        includeFeatures: [],
      },
    })

    const customInstructions = 'Focus on their recent funding announcement'
    const prompt = await buildGeminiPrompt(mockContact, customInstructions)
    expect(prompt).toContain(customInstructions)
  })
})
