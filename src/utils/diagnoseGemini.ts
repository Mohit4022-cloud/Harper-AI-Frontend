import { toast } from 'sonner';

export async function diagnoseGemini(): Promise<void> {
  try {
    // Simple echo test to Gemini health endpoint
    const response = await fetch('/api/gemini/health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'echo',
        maxTokens: 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error('Gemini health check returned unsuccessful');
    }
  } catch (error) {
    console.error('Gemini diagnosis failed:', error);
    toast.error('Gemini API is unreachable', {
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function runEmailGeneratorSmokeTest(): Promise<void> {
  try {
    await diagnoseGemini();
    
    // Generate dummy contact
    const dummyContact = {
      id: 'test-' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company',
      title: 'Test Manager',
      fullName: 'Test User',
      companyName: 'Test Company',
      jobTitle: 'Test Manager'
    };
    
    // Process with harperAI integration if available
    if (typeof window !== 'undefined' && (window as any).harperAI?.processZoomInfoContacts) {
      const results = await (window as any).harperAI.processZoomInfoContacts([dummyContact]);
      
      const qualified = results.find((r: any) => r.status === 'QUALIFIED');
      if (!qualified || !qualified.generatedEmail) {
        throw new Error('No qualified email generated');
      }
      
      toast.success('Email generator smoke test passed', {
        description: 'Successfully generated test email'
      });
    } else {
      // Fallback test - just check API endpoint
      const response = await fetch('/api/email/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: [dummyContact],
          settings: {
            tone: 'Professional',
            length: 'medium',
            subjectStyle: 'question',
            cta: 'meeting',
            focusAreas: [],
            includeFeatures: []
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Email generation API failed');
      }
      
      toast.success('Email generator smoke test passed', {
        description: 'API endpoint is functional'
      });
    }
  } catch (error) {
    toast.error('Email generator smoke test failed', {
      description: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}