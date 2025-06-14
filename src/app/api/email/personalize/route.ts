import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Validation schemas
const emailSettingsSchema = z.object({
  tone: z.enum(['Professional', 'Consultative', 'Direct', 'Friendly', 'Urgent']),
  length: z.enum(['short', 'medium', 'long']),
  subjectStyle: z.enum(['question', 'benefit', 'company-specific', 'statistic', 'personal']),
  cta: z.string(),
  focusAreas: z.array(z.string()),
  personalizationDepth: z.number().min(1).max(5),
  includeFeatures: z.array(z.string()),
  customInstructions: z.string().optional(),
})

const personalizeRequestSchema = z.object({
  contactIds: z.array(z.string()).optional(),
  csvData: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    company: z.string(),
    title: z.string(),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
  })).optional(),
  settings: emailSettingsSchema,
  enableEnrichment: z.boolean().default(true),
  templateId: z.string().optional(),
})

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// Enrichment functions
async function enrichCompanyData(domain: string, companyName: string) {
  const enriched: any = {}
  
  try {
    // Apollo.io enrichment
    if (process.env.APOLLO_API_KEY) {
      const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/enrich', {
        method: 'POST',
        headers: {
          'Api-Key': process.env.APOLLO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      })
      
      if (apolloResponse.ok) {
        enriched.apollo = await apolloResponse.json()
      }
    }
    
    // NewsAPI for recent company news
    if (process.env.NEWS_API_KEY) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const newsResponse = await fetch(
        `https://newsapi.org/v2/everything?` + new URLSearchParams({
          q: `"${companyName}"`,
          from: thirtyDaysAgo.toISOString().split('T')[0],
          sortBy: 'relevancy',
          pageSize: '5',
          apiKey: process.env.NEWS_API_KEY,
        })
      )
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json()
        enriched.news = newsData.articles?.slice(0, 3) || []
      }
    }
  } catch (error) {
    console.error('Error enriching data:', error)
  }
  
  return enriched
}

async function generatePersonalizedEmail(
  context: any,
  settings: z.infer<typeof emailSettingsSchema>,
  enrichedData: any
) {
  // Build comprehensive prompt with enriched data
  let newsContext = ''
  if (enrichedData.news?.length > 0) {
    const newsItems = enrichedData.news.slice(0, 2).map((article: any) => `- ${article.title}`)
    newsContext = `\nRecent Company News:\n${newsItems.join('\n')}`
  }
  
  let companyInsights = ''
  if (enrichedData.apollo?.organization) {
    const org = enrichedData.apollo.organization
    if (org.estimated_num_employees) {
      companyInsights += `\nEmployee Count: ${org.estimated_num_employees}`
    }
    if (org.industry) {
      companyInsights += `\nIndustry: ${org.industry}`
    }
  }
  
  const prompt = `
    You are an expert B2B SDR. Generate a hyper-personalized cold email.
    
    RECIPIENT INFORMATION:
    - Name: ${context.name}
    - Title: ${context.title}
    - Company: ${context.company}
    - Industry: ${context.industry || 'Technology'}
    - Company Size: ${context.companySize || 'Unknown'} employees
    ${companyInsights}
    ${newsContext}
    
    EMAIL REQUIREMENTS:
    - Format: Hook (company-specific achievement/challenge), Insight (industry trend), Provocative Request
    - Length: ${settings.length === 'short' ? 'Under 100 words' : settings.length === 'medium' ? '100-150 words' : '150-200 words'}
    - Tone: ${settings.tone}
    - Focus: ${settings.focusAreas.join(', ')}
    - Call to Action: ${settings.cta}
    - Subject Style: ${settings.subjectStyle}
    
    ${settings.customInstructions ? `ADDITIONAL INSTRUCTIONS: ${settings.customInstructions}` : ''}
    
    CRITICAL: 
    - Reference specific company news or achievements if available
    - Use industry-specific pain points
    - Make the email feel like it was written specifically for them
    - Keep it concise and compelling
    
    Return ONLY a JSON object with these keys:
    - subject: string (compelling subject line)
    - body: string (email body with proper greeting and sign-off)
    - personalizationNotes: array of strings (what personalization elements were used)
  `
  
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback if JSON parsing fails
    throw new Error('Failed to parse AI response')
  } catch (error) {
    console.error('Error generating email:', error)
    
    // Fallback template
    return {
      subject: `${context.company}'s growth trajectory - quick question`,
      body: `Hi ${context.name},

I noticed ${context.company} is ${context.industry ? `making waves in the ${context.industry} space` : 'growing rapidly'}. ${newsContext ? 'Congrats on the recent news!' : ''}

Most ${context.industry || 'companies'} at your stage face challenges with [specific challenge]. I'm curious - how are you currently handling [related process]?

Worth a quick ${settings.cta}?

Best,
[Your Name]`,
      personalizationNotes: ['Company name', 'Industry reference', 'Role-based challenge'],
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = personalizeRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { contactIds, csvData, settings, enableEnrichment, templateId } = validationResult.data
    
    // Prepare contacts data
    let contacts: any[] = []
    
    if (contactIds && contactIds.length > 0) {
      // Fetch contacts from database
      const dbContacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
          organizationId: payload.organizationId,
        },
        include: {
          company: true,
        },
      })
      
      contacts = dbContacts.map(contact => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        company: contact.company?.name || (contact.customFields as any)?.company || 'Unknown',
        title: contact.title || 'Unknown',
        industry: contact.company?.industry || (contact.customFields as any)?.industry,
        companySize: contact.company?.size || (contact.customFields as any)?.companySize,
        website: contact.company?.domain || (contact.customFields as any)?.website,
        linkedin: contact.linkedin,
      }))
    } else if (csvData && csvData.length > 0) {
      contacts = csvData
    } else {
      return NextResponse.json(
        { error: 'Either contactIds or csvData must be provided' },
        { status: 400 }
      )
    }
    
    // Limit batch size
    if (contacts.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 contacts per batch' },
        { status: 400 }
      )
    }
    
    // Generate personalized emails
    const results = []
    const errors = []
    
    for (const contact of contacts) {
      try {
        // Enrichment
        let enrichedData = {}
        if (enableEnrichment && contact.website) {
          enrichedData = await enrichCompanyData(contact.website, contact.company)
        }
        
        // Generate email
        const emailContent = await generatePersonalizedEmail(contact, settings, enrichedData)
        
        // Save to database if contact has ID
        let savedEmail = null
        if (contact.id) {
          savedEmail = await prisma.email.create({
            data: {
              subject: emailContent.subject,
              body: emailContent.body,
              status: 'DRAFT',
              userId: payload.userId,
              fromEmail: 'ai@harperai.com',
              recipients: {
                create: {
                  contactId: contact.id,
                },
              },
            },
            include: {
              recipients: {
                include: {
                  contact: true,
                },
              },
            },
          })
        }
        
        results.push({
          contact,
          email: emailContent,
          enrichedData,
          savedEmailId: savedEmail?.id,
        })
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error processing contact ${contact.email}:`, error)
        errors.push({
          contact: contact.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    // Create email campaign record (if EmailCampaign model exists)
    let campaign = null;
    try {
      campaign = await (prisma as any).emailCampaign.create({
      data: {
        name: `AI Personalized Campaign - ${new Date().toLocaleDateString()}`,
        status: 'DRAFT',
        organizationId: payload.organizationId,
        createdById: payload.userId,
        settings: settings as any,
        stats: {
          total: contacts.length,
          generated: results.length,
          errors: errors.length,
        },
      },
    });
    } catch (e) {
      // EmailCampaign model may not exist yet
      console.log('EmailCampaign model not found, skipping campaign creation');
    }
    
    return NextResponse.json({
      success: true,
      campaignId: campaign?.id,
      results,
      errors,
      stats: {
        total: contacts.length,
        successful: results.length,
        failed: errors.length,
      },
    })
  } catch (error) {
    console.error('Error in email personalization:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}