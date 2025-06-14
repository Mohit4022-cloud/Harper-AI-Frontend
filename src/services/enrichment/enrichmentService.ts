/**
 * Contact Enrichment Service
 * 
 * Handles data enrichment from multiple sources:
 * - Apollo.io for professional data
 * - NewsAPI for recent news and company updates
 * - LinkedIn (placeholder for future implementation)
 * - Clearbit (placeholder for future implementation)
 */

import { prisma } from '@/lib/prisma';
import { EnrichmentSource, EnrichmentStatus } from '@prisma/client';

// Type definitions
interface EnrichmentResult {
  source: EnrichmentSource;
  data: any;
  confidence?: number;
  error?: string;
}

interface ApolloContact {
  name?: string;
  title?: string;
  company?: {
    name?: string;
    domain?: string;
    industry?: string;
    size?: string;
    description?: string;
  };
  linkedin_url?: string;
  twitter_url?: string;
  technologies?: string[];
  intent_signals?: string[];
}

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

/**
 * Main enrichment function
 */
export async function enrichContact(
  contactId: string,
  source: EnrichmentSource
): Promise<any> {
  try {
    // Check if we have recent enrichment data
    const existingEnrichment = await prisma.contactEnrichment.findFirst({
      where: {
        contactId,
        source,
        status: EnrichmentStatus.SUCCESS,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (existingEnrichment) {
      return existingEnrichment.data;
    }

    // Get contact details
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { company: true },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Perform enrichment based on source
    let enrichmentResult: EnrichmentResult;

    switch (source) {
      case EnrichmentSource.APOLLO:
        enrichmentResult = await enrichFromApollo(contact);
        break;
      case EnrichmentSource.NEWSAPI:
        enrichmentResult = await enrichFromNewsAPI(contact);
        break;
      case EnrichmentSource.LINKEDIN:
        enrichmentResult = await enrichFromLinkedIn(contact);
        break;
      case EnrichmentSource.CLEARBIT:
        enrichmentResult = await enrichFromClearbit(contact);
        break;
      default:
        throw new Error(`Unsupported enrichment source: ${source}`);
    }

    // Store enrichment result
    const enrichment = await prisma.contactEnrichment.create({
      data: {
        contactId,
        source,
        data: enrichmentResult.data,
        confidence: enrichmentResult.confidence,
        status: enrichmentResult.error ? EnrichmentStatus.FAILED : EnrichmentStatus.SUCCESS,
        error: enrichmentResult.error,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Update contact with enriched data if successful
    if (!enrichmentResult.error && enrichmentResult.data) {
      await updateContactWithEnrichment(contact.id, enrichmentResult);
    }

    return enrichmentResult.data;
  } catch (error) {
    console.error('Enrichment error:', error);
    throw error;
  }
}

/**
 * Apollo.io enrichment
 */
async function enrichFromApollo(contact: any): Promise<EnrichmentResult> {
  try {
    const apolloApiKey = process.env.APOLLO_API_KEY;
    
    if (!apolloApiKey) {
      return {
        source: EnrichmentSource.APOLLO,
        data: null,
        error: 'Apollo API key not configured',
      };
    }

    // Apollo.io people search API
    const response = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloApiKey,
      },
      body: JSON.stringify({
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        organization_name: contact.company?.name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.person) {
      const apolloData: ApolloContact = data.person;
      
      return {
        source: EnrichmentSource.APOLLO,
        data: {
          professionalInfo: {
            title: apolloData.title,
            company: apolloData.company?.name,
            industry: apolloData.company?.industry,
            companySize: apolloData.company?.size,
            companyDescription: apolloData.company?.description,
          },
          socialProfiles: {
            linkedin: apolloData.linkedin_url,
            twitter: apolloData.twitter_url,
          },
          technologies: apolloData.technologies || [],
          intentSignals: apolloData.intent_signals || [],
          enrichedAt: new Date().toISOString(),
        },
        confidence: data.confidence || 0.8,
      };
    }

    return {
      source: EnrichmentSource.APOLLO,
      data: null,
      error: 'No matching person found',
    };
  } catch (error) {
    console.error('Apollo enrichment error:', error);
    return {
      source: EnrichmentSource.APOLLO,
      data: null,
      error: error instanceof Error ? error.message : 'Apollo enrichment failed',
    };
  }
}

/**
 * NewsAPI enrichment
 */
async function enrichFromNewsAPI(contact: any): Promise<EnrichmentResult> {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    
    if (!newsApiKey) {
      return {
        source: EnrichmentSource.NEWSAPI,
        data: null,
        error: 'NewsAPI key not configured',
      };
    }

    // Build search query
    const searchTerms = [];
    if (contact.company?.name) {
      searchTerms.push(`"${contact.company.name}"`);
    }
    if (contact.firstName && contact.lastName) {
      searchTerms.push(`"${contact.firstName} ${contact.lastName}"`);
    }

    if (searchTerms.length === 0) {
      return {
        source: EnrichmentSource.NEWSAPI,
        data: null,
        error: 'Insufficient data for news search',
      };
    }

    // Search for recent news
    const query = searchTerms.join(' OR ');
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(query)}&` +
      `sortBy=relevancy&` +
      `language=en&` +
      `pageSize=10&` +
      `from=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`, // Last 30 days
      {
        headers: {
          'X-Api-Key': newsApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      const articles: NewsAPIArticle[] = data.articles;
      
      return {
        source: EnrichmentSource.NEWSAPI,
        data: {
          recentNews: articles.slice(0, 5).map((article: NewsAPIArticle) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source.name,
          })),
          newsCount: data.totalResults,
          lastUpdated: new Date().toISOString(),
        },
        confidence: 0.9,
      };
    }

    return {
      source: EnrichmentSource.NEWSAPI,
      data: {
        recentNews: [],
        newsCount: 0,
        lastUpdated: new Date().toISOString(),
      },
      confidence: 0.9,
    };
  } catch (error) {
    console.error('NewsAPI enrichment error:', error);
    return {
      source: EnrichmentSource.NEWSAPI,
      data: null,
      error: error instanceof Error ? error.message : 'NewsAPI enrichment failed',
    };
  }
}

/**
 * LinkedIn enrichment (placeholder)
 */
async function enrichFromLinkedIn(contact: any): Promise<EnrichmentResult> {
  // LinkedIn API requires OAuth and specific partnership
  // This is a placeholder for future implementation
  return {
    source: EnrichmentSource.LINKEDIN,
    data: null,
    error: 'LinkedIn enrichment not yet implemented',
  };
}

/**
 * Clearbit enrichment (placeholder)
 */
async function enrichFromClearbit(contact: any): Promise<EnrichmentResult> {
  // Clearbit enrichment placeholder
  // Implementation would follow similar pattern to Apollo
  return {
    source: EnrichmentSource.CLEARBIT,
    data: null,
    error: 'Clearbit enrichment not yet implemented',
  };
}

/**
 * Update contact with enrichment data
 */
async function updateContactWithEnrichment(
  contactId: string,
  enrichmentResult: EnrichmentResult
) {
  try {
    const updates: any = {};
    
    if (enrichmentResult.source === EnrichmentSource.APOLLO && enrichmentResult.data) {
      const apolloData = enrichmentResult.data;
      
      // Update professional info
      if (apolloData.professionalInfo?.title) {
        updates.title = apolloData.professionalInfo.title;
      }
      
      // Update social profiles
      if (apolloData.socialProfiles?.linkedin) {
        updates.linkedin = apolloData.socialProfiles.linkedin;
      }
      if (apolloData.socialProfiles?.twitter) {
        updates.twitter = apolloData.socialProfiles.twitter;
      }
      
      // Store additional data in customFields
      updates.customFields = {
        ...(updates.customFields || {}),
        apolloTechnologies: apolloData.technologies,
        apolloIntentSignals: apolloData.intentSignals,
      };
    }

    // Update enrichment metadata
    updates.enrichmentData = enrichmentResult.data;
    updates.enrichmentDate = new Date();
    updates.enrichmentSource = enrichmentResult.source;

    if (Object.keys(updates).length > 0) {
      await prisma.contact.update({
        where: { id: contactId },
        data: updates,
      });
    }
  } catch (error) {
    console.error('Error updating contact with enrichment:', error);
  }
}

/**
 * Batch enrichment for multiple contacts
 */
export async function batchEnrichContacts(
  contactIds: string[],
  sources: EnrichmentSource[]
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < contactIds.length; i += batchSize) {
    const batch = contactIds.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (contactId) => {
        const contactEnrichment: any = {};
        
        for (const source of sources) {
          try {
            const enrichment = await enrichContact(contactId, source);
            if (enrichment) {
              contactEnrichment[source] = enrichment;
            }
          } catch (error) {
            console.error(`Enrichment failed for contact ${contactId}, source ${source}:`, error);
          }
        }
        
        results.set(contactId, contactEnrichment);
      })
    );
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < contactIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}