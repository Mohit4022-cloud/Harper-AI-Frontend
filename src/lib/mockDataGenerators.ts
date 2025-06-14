import { faker } from '@faker-js/faker';

// Call-related mock data generators
export function generateMockCall(id?: string) {
  const duration = faker.number.int({ min: 30, max: 600 });
  const outcome = faker.helpers.arrayElement(['connected', 'voicemail', 'no_answer', 'busy', 'failed']);
  
  return {
    id: id || faker.string.uuid(),
    contactId: faker.string.uuid(),
    contactName: faker.person.fullName(),
    phoneNumber: faker.phone.number(),
    duration,
    outcome,
    sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
    sentimentScore: faker.number.float({ min: -1, max: 1, fractionDigits: 2 }),
    startTime: faker.date.recent({ days: 7 }),
    endTime: new Date(Date.now() - duration * 1000),
    recording: outcome === 'connected' ? {
      url: `https://api.harperai.com/recordings/${faker.string.uuid()}.mp3`,
      duration,
      size: duration * 16000 // ~16KB per second
    } : null,
    transcript: outcome === 'connected' ? generateTranscript() : null,
    aiInsights: outcome === 'connected' ? generateCallInsights() : null,
    metadata: {
      dialerVersion: '2.1.0',
      region: faker.location.state({ abbreviated: true }),
      device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet'])
    }
  };
}

export function generateTranscript() {
  const topics = [
    'pricing discussion',
    'feature inquiry',
    'technical support',
    'contract negotiation',
    'product demo request',
    'competitor comparison'
  ];
  
  const speakers = [
    { role: 'agent', name: 'Agent' },
    { role: 'customer', name: 'Customer' }
  ];
  
  const numTurns = faker.number.int({ min: 10, max: 30 });
  const transcript = [];
  
  for (let i = 0; i < numTurns; i++) {
    const speaker = speakers[i % 2];
    transcript.push({
      speaker: speaker.name,
      role: speaker.role,
      text: faker.lorem.sentence({ min: 5, max: 20 }),
      timestamp: i * faker.number.int({ min: 3, max: 10 }),
      sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
      keywords: faker.helpers.arrayElements(topics, { min: 0, max: 2 })
    });
  }
  
  return transcript;
}

export function generateCallInsights() {
  return {
    summary: faker.lorem.paragraph({ min: 2, max: 4 }),
    keyPoints: faker.helpers.arrayElements([
      'Customer interested in enterprise features',
      'Budget constraint mentioned',
      'Timeline: Q2 2025',
      'Decision maker identified',
      'Competitor mentioned: Salesforce',
      'Follow-up meeting scheduled',
      'Technical requirements discussed',
      'Integration needs identified'
    ], { min: 3, max: 5 }),
    sentiment: {
      overall: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
      score: faker.number.float({ min: -1, max: 1, fractionDigits: 2 }),
      breakdown: {
        positive: faker.number.int({ min: 0, max: 100 }),
        neutral: faker.number.int({ min: 0, max: 100 }),
        negative: faker.number.int({ min: 0, max: 100 })
      }
    },
    objections: faker.helpers.arrayElements([
      { type: 'price', severity: 'high', response: 'Discussed ROI and value proposition' },
      { type: 'timing', severity: 'medium', response: 'Offered phased implementation' },
      { type: 'features', severity: 'low', response: 'Scheduled technical deep-dive' }
    ], { min: 0, max: 3 }),
    nextSteps: faker.helpers.arrayElements([
      'Send pricing proposal',
      'Schedule technical demo',
      'Connect with decision maker',
      'Provide case studies',
      'Set up trial account'
    ], { min: 1, max: 3 }),
    competitorsMentioned: faker.helpers.arrayElements(
      ['Salesforce', 'HubSpot', 'Pipedrive', 'Monday.com', 'Outreach'],
      { min: 0, max: 2 }
    ),
    painPoints: faker.helpers.arrayElements([
      'Current CRM limitations',
      'Manual data entry',
      'Lack of automation',
      'Poor reporting capabilities',
      'Integration challenges'
    ], { min: 1, max: 3 }),
    buyingSignals: {
      score: faker.number.int({ min: 0, max: 100 }),
      indicators: faker.helpers.arrayElements([
        'Asked about pricing',
        'Discussed implementation timeline',
        'Mentioned budget approval process',
        'Requested references',
        'Inquired about contract terms'
      ], { min: 0, max: 3 })
    }
  };
}

// Report/Analytics mock data generators
export function generateMockMetrics(timeRange: { start: Date; end: Date }) {
  const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    summary: {
      totalCalls: faker.number.int({ min: 100 * days, max: 300 * days }),
      totalDuration: faker.number.int({ min: 5000 * days, max: 15000 * days }),
      avgCallDuration: faker.number.int({ min: 180, max: 360 }),
      connectRate: faker.number.float({ min: 0.25, max: 0.45, fractionDigits: 2 }),
      conversionRate: faker.number.float({ min: 0.08, max: 0.15, fractionDigits: 2 }),
      totalEmails: faker.number.int({ min: 500 * days, max: 1000 * days }),
      emailOpenRate: faker.number.float({ min: 0.15, max: 0.35, fractionDigits: 2 }),
      emailResponseRate: faker.number.float({ min: 0.05, max: 0.12, fractionDigits: 2 }),
      meetingsScheduled: faker.number.int({ min: 10 * days, max: 30 * days }),
      opportunitiesCreated: faker.number.int({ min: 5 * days, max: 15 * days }),
      revenue: faker.number.int({ min: 50000 * days, max: 150000 * days })
    },
    trends: generateTrendData(days),
    topPerformers: generateTopPerformers(),
    callOutcomes: {
      connected: faker.number.int({ min: 25, max: 45 }),
      voicemail: faker.number.int({ min: 20, max: 35 }),
      no_answer: faker.number.int({ min: 15, max: 25 }),
      busy: faker.number.int({ min: 5, max: 10 }),
      failed: faker.number.int({ min: 2, max: 5 })
    }
  };
}

export function generateTrendData(days: number) {
  const data = [];
  const baseCallsPerDay = faker.number.int({ min: 150, max: 250 });
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const variation = faker.number.float({ min: 0.8, max: 1.2 });
    const calls = Math.round(baseCallsPerDay * variation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      calls,
      emails: Math.round(calls * faker.number.float({ min: 3, max: 5 })),
      meetings: Math.round(calls * faker.number.float({ min: 0.05, max: 0.1 })),
      opportunities: Math.round(calls * faker.number.float({ min: 0.02, max: 0.05 })),
      connectRate: faker.number.float({ min: 0.25, max: 0.45, fractionDigits: 3 }),
      avgSentiment: faker.number.float({ min: -0.2, max: 0.5, fractionDigits: 2 })
    });
  }
  
  return data;
}

export function generateTopPerformers() {
  const agents = [];
  
  for (let i = 0; i < 5; i++) {
    agents.push({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.string.uuid()}`,
      metrics: {
        calls: faker.number.int({ min: 200, max: 500 }),
        connectRate: faker.number.float({ min: 0.3, max: 0.5, fractionDigits: 2 }),
        meetings: faker.number.int({ min: 10, max: 30 }),
        revenue: faker.number.int({ min: 50000, max: 200000 })
      },
      trend: faker.helpers.arrayElement(['up', 'down', 'stable'])
    });
  }
  
  return agents.sort((a, b) => b.metrics.revenue - a.metrics.revenue);
}

// AI Coaching suggestions
export function generateCoachingSuggestions(context?: any) {
  const suggestions = [
    {
      type: 'objection_handling',
      priority: 'high',
      title: 'Price Objection Detected',
      suggestion: 'Pivot to value proposition and ROI discussion',
      script: 'I understand price is a concern. Let me show you how our clients typically see ROI within 3 months...'
    },
    {
      type: 'engagement',
      priority: 'medium',
      title: 'Low Customer Engagement',
      suggestion: 'Ask an open-ended question to re-engage',
      script: 'What specific challenges are you facing with your current solution?'
    },
    {
      type: 'closing',
      priority: 'high',
      title: 'Buying Signal Detected',
      suggestion: 'Move towards scheduling next steps',
      script: 'Based on what you\'ve shared, it sounds like this could be a good fit. Should we schedule a deeper dive with your team?'
    },
    {
      type: 'rapport',
      priority: 'low',
      title: 'Build Stronger Connection',
      suggestion: 'Mirror customer\'s communication style',
      script: 'I noticed you mentioned [specific detail]. Tell me more about that...'
    }
  ];
  
  return faker.helpers.arrayElements(suggestions, { min: 1, max: 3 });
}

// Simulate API delay and potential errors
export async function simulateApiResponse<T>(
  data: T,
  options?: {
    delay?: number;
    errorRate?: number;
    errorMessage?: string;
  }
): Promise<T> {
  const { delay = 500, errorRate = 0, errorMessage = 'Simulated API error' } = options || {};
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simulate random error
  if (Math.random() < errorRate) {
    throw new Error(errorMessage);
  }
  
  return data;
}