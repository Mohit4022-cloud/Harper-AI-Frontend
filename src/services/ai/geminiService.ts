/**
 * Gemini AI Service for Email Personalization
 * 
 * Handles AI-powered email generation using Google's Gemini API
 * Features:
 * - Template-based personalization
 * - Context-aware content generation
 * - Tone and length customization
 * - Enrichment data integration
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmailTemplate } from '@prisma/client';

// Type definitions
interface PersonalizationContext {
  template: EmailTemplate;
  contact: any;
  enrichmentData?: any;
  tone?: string;
  length?: string;
  customPrompt?: string;
}

interface PersonalizedEmailResult {
  subject: string;
  body: string;
  html?: string;
  tokenCount?: number;
  confidence?: number;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate personalized email using Gemini AI
 */
export async function generatePersonalizedEmail(
  context: PersonalizationContext
): Promise<PersonalizedEmailResult> {
  try {
    // Select model based on requirements
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build comprehensive prompt
    const prompt = buildPersonalizationPrompt(context);

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the generated content
    const personalizedEmail = parseGeneratedEmail(text);

    // Calculate confidence based on available data
    const confidence = calculateConfidence(context);

    // Convert to HTML if needed
    const html = convertToHTML(personalizedEmail.body);

    return {
      subject: personalizedEmail.subject,
      body: personalizedEmail.body,
      html,
      tokenCount: response.usageMetadata?.totalTokenCount,
      confidence,
    };
  } catch (error) {
    console.error('Gemini AI generation error:', error);
    
    // Fallback to template with basic personalization
    return fallbackPersonalization(context);
  }
}

/**
 * Build comprehensive prompt for email personalization
 */
function buildPersonalizationPrompt(context: PersonalizationContext): string {
  const { template, contact, enrichmentData, tone, length, customPrompt } = context;

  // Extract contact information
  const contactInfo = {
    name: `${contact.firstName} ${contact.lastName}`,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    title: contact.title || 'Professional',
    company: contact.company?.name || 'their company',
    department: contact.department,
    linkedin: contact.linkedin,
  };

  // Extract enrichment insights
  const insights = extractEnrichmentInsights(enrichmentData);

  // Build the prompt
  const prompt = `You are an expert sales development representative crafting a personalized email.

TEMPLATE:
Subject: ${template.subject}
Body: ${template.body}

RECIPIENT INFORMATION:
- Name: ${contactInfo.name}
- Title: ${contactInfo.title}
- Company: ${contactInfo.company}
- Department: ${contactInfo.department || 'N/A'}
${contact.leadScore ? `- Lead Score: ${contact.leadScore}/100` : ''}
${contact.leadStatus ? `- Lead Status: ${contact.leadStatus}` : ''}

${insights.length > 0 ? `ENRICHMENT INSIGHTS:\n${insights.join('\n')}` : ''}

PERSONALIZATION REQUIREMENTS:
- Tone: ${tone || 'professional and friendly'}
- Length: ${length || 'medium (150-200 words)'}
- Personalize the email using ALL available information
- Make specific references to the recipient's company, role, or recent activities
- Ensure the email feels genuinely personal, not templated
- Include a clear call-to-action
- Maintain the core message and value proposition from the template

${customPrompt ? `ADDITIONAL INSTRUCTIONS:\n${customPrompt}` : ''}

OUTPUT FORMAT:
Generate the personalized email in the following format:
SUBJECT: [Personalized subject line]
BODY: [Personalized email body]

Important: Make the email feel natural and conversational while maintaining professionalism.`;

  return prompt;
}

/**
 * Extract insights from enrichment data
 */
function extractEnrichmentInsights(enrichmentData: any): string[] {
  const insights: string[] = [];

  if (!enrichmentData) return insights;

  // Apollo insights
  if (enrichmentData.APOLLO) {
    const apollo = enrichmentData.APOLLO;
    
    if (apollo.professionalInfo?.companyDescription) {
      insights.push(`- Company Description: ${apollo.professionalInfo.companyDescription}`);
    }
    
    if (apollo.technologies?.length > 0) {
      insights.push(`- Technologies Used: ${apollo.technologies.slice(0, 5).join(', ')}`);
    }
    
    if (apollo.intentSignals?.length > 0) {
      insights.push(`- Intent Signals: ${apollo.intentSignals.slice(0, 3).join(', ')}`);
    }
  }

  // News insights
  if (enrichmentData.NEWSAPI?.recentNews?.length > 0) {
    const topNews = enrichmentData.NEWSAPI.recentNews[0];
    insights.push(`- Recent News: "${topNews.title}" (${new Date(topNews.publishedAt).toLocaleDateString()})`);
  }

  return insights;
}

/**
 * Parse generated email from AI response
 */
function parseGeneratedEmail(text: string): { subject: string; body: string } {
  const lines = text.trim().split('\n');
  let subject = '';
  let body = '';
  let inBody = false;

  for (const line of lines) {
    if (line.startsWith('SUBJECT:')) {
      subject = line.substring(8).trim();
    } else if (line.startsWith('BODY:')) {
      body = line.substring(5).trim();
      inBody = true;
    } else if (inBody) {
      body += '\n' + line;
    }
  }

  // Fallback if parsing fails
  if (!subject || !body) {
    const parts = text.split('\n\n');
    subject = parts[0]?.substring(0, 100) || 'Follow-up';
    body = parts.slice(1).join('\n\n') || text;
  }

  return {
    subject: subject.trim(),
    body: body.trim(),
  };
}

/**
 * Calculate confidence score based on available data
 */
function calculateConfidence(context: PersonalizationContext): number {
  let score = 0.5; // Base confidence

  const { contact, enrichmentData } = context;

  // Contact completeness
  if (contact.title) score += 0.1;
  if (contact.company) score += 0.1;
  if (contact.linkedin) score += 0.05;
  if (contact.leadScore > 50) score += 0.1;

  // Enrichment data
  if (enrichmentData?.APOLLO) score += 0.1;
  if (enrichmentData?.NEWSAPI?.recentNews?.length > 0) score += 0.05;

  return Math.min(score, 1.0);
}

/**
 * Convert plain text to HTML
 */
function convertToHTML(text: string): string {
  // Basic HTML conversion
  let html = text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  // Convert common patterns
  html = html
    // Bold text **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text *text*
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Wrap in basic HTML structure
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    p { margin: 1em 0; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

/**
 * Fallback personalization when AI fails
 */
function fallbackPersonalization(context: PersonalizationContext): PersonalizedEmailResult {
  const { template, contact } = context;

  // Simple variable replacement
  const variables = {
    first_name: contact.firstName,
    last_name: contact.lastName,
    full_name: `${contact.firstName} ${contact.lastName}`,
    company: contact.company?.name || 'your company',
    title: contact.title || 'there',
  };

  let subject = template.subject;
  let body = template.body;

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });

  return {
    subject,
    body,
    html: convertToHTML(body),
    confidence: 0.3,
  };
}

/**
 * Batch email generation with rate limiting
 */
export async function batchGenerateEmails(
  contexts: PersonalizationContext[],
  options: { batchSize?: number; delayMs?: number } = {}
): Promise<PersonalizedEmailResult[]> {
  const { batchSize = 5, delayMs = 1000 } = options;
  const results: PersonalizedEmailResult[] = [];

  for (let i = 0; i < contexts.length; i += batchSize) {
    const batch = contexts.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(context => generatePersonalizedEmail(context))
    );
    
    results.push(...batchResults);

    // Rate limiting delay
    if (i + batchSize < contexts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Validate Gemini API key
 */
export async function validateGeminiAPIKey(): Promise<boolean> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return false;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, this is a test.');
    return true;
  } catch (error) {
    console.error('Gemini API key validation failed:', error);
    return false;
  }
}