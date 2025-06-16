import { GeminiClient } from './client';
import { ZoomInfoProcessor, ZoomInfoContact, ICPValidation } from './zoominfo-processor';
import { MASTER_SYSTEM_PROMPT } from './system-prompt';

export interface ProcessingResult {
  contact: ZoomInfoContact;
  status: 'QUALIFIED' | 'NOT_QUALIFIED' | 'ERROR';
  email?: string;
  reasons?: string[];
  error?: string;
}

export class HarperAIGeminiIntegration {
  private geminiClient: GeminiClient | null = null;
  private zoomInfoProcessor: ZoomInfoProcessor;
  private isInitialized = false;

  constructor() {
    this.zoomInfoProcessor = new ZoomInfoProcessor();
  }

  initialize(geminiApiKey: string): void {
    if (!geminiApiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.geminiClient = new GeminiClient(geminiApiKey);
    this.isInitialized = true;
    console.log('Harper AI + Gemini integration initialized successfully');
  }

  async processZoomInfoContacts(
    csvData: any[], 
    customInstructions = ''
  ): Promise<ProcessingResult[]> {
    if (!this.isInitialized || !this.geminiClient) {
      throw new Error('Integration not initialized. Please provide Gemini API key first.');
    }

    const contacts = this.zoomInfoProcessor.processZoomInfoData(csvData);
    const results: ProcessingResult[] = [];

    for (const contact of contacts) {
      try {
        // Validate ICP
        const icpValidation = this.zoomInfoProcessor.validateICP(contact);
        
        if (!icpValidation.qualified) {
          results.push({
            contact: contact,
            status: 'NOT_QUALIFIED',
            reasons: icpValidation.reasons,
          });
          continue;
        }

        // Generate email using Gemini
        const prompt = this.buildGeminiPrompt(contact, customInstructions);
        const emailContent = await this.geminiClient.generateContent(prompt);
        
        results.push({
          contact: contact,
          status: 'QUALIFIED',
          email: emailContent,
          reasons: []
        });

        // Add delay to avoid rate limiting
        await this.delay(1000);

      } catch (error) {
        console.error(`Error processing contact ${contact.email}:`, error);
        results.push({
          contact: contact,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private buildGeminiPrompt(contact: ZoomInfoContact, customInstructions: string): string {
    const contactData = JSON.stringify(contact, null, 2);
    
    return `${MASTER_SYSTEM_PROMPT}

## CONTACT DATA TO ANALYZE:
${contactData}

## CUSTOM INSTRUCTIONS:
${customInstructions || 'Follow standard Productiv outreach guidelines.'}

## YOUR TASK:
1. Analyze the provided ZoomInfo contact data
2. Conduct research on the company and individual (simulate research findings based on the data provided)
3. Verify ICP qualification
4. If qualified, craft a hyper-personalized email following all guidelines
5. Provide response in the exact OUTPUT FORMAT specified above

Begin your analysis now:`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}