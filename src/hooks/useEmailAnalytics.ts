import { useMemo } from 'react'

interface GeneratedEmail {
  contact: any
  email: {
    subject: string
    body: string
    personalizationNotes: string[]
  }
}

export const useEmailAnalytics = (emails: GeneratedEmail[]) => {
  return useMemo(() => {
    if (emails.length === 0) {
      return {
        avgWordCount: 0,
        readingLevel: 'N/A',
        spamScore: 0,
        personalizationScore: 0,
        topPersonalizations: []
      }
    }

    // Calculate average word count
    const wordCounts = emails.map(e => 
      e.email.body.split(/\s+/).filter(word => word.length > 0).length
    )
    const avgWordCount = Math.round(
      wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length
    )

    // Calculate reading level (simplified)
    const avgSentenceLength = emails.map(e => {
      const sentences = e.email.body.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const words = e.email.body.split(/\s+/).filter(w => w.length > 0)
      return sentences.length > 0 ? words.length / sentences.length : 0
    }).reduce((a, b) => a + b, 0) / emails.length

    const readingLevel = 
      avgSentenceLength < 10 ? 'Easy' :
      avgSentenceLength < 15 ? 'Medium' :
      avgSentenceLength < 20 ? 'Hard' : 'Very Hard'

    // Calculate spam score (check for spam trigger words)
    const spamWords = ['free', 'guarantee', 'no obligation', 'risk-free', 'urgent', 'act now', 'limited time']
    const spamScore = Math.round(
      emails.reduce((score, e) => {
        const bodyLower = e.email.body.toLowerCase()
        const subjectLower = e.email.subject.toLowerCase()
        const spamCount = spamWords.filter(word => 
          bodyLower.includes(word) || subjectLower.includes(word)
        ).length
        return score + (spamCount / spamWords.length) * 100
      }, 0) / emails.length
    )

    // Calculate personalization score
    const personalizationScore = Math.round(
      emails.reduce((score, e) => 
        score + Math.min(e.email.personalizationNotes.length * 2, 10)
      , 0) / emails.length
    )

    // Get top personalization elements
    const allPersonalizations = emails.flatMap(e => e.email.personalizationNotes)
    const personalizationCounts = allPersonalizations.reduce((acc, note) => {
      acc[note] = (acc[note] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topPersonalizations = Object.entries(personalizationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([note]) => note)

    return {
      avgWordCount,
      readingLevel,
      spamScore,
      personalizationScore,
      topPersonalizations
    }
  }, [emails])
}