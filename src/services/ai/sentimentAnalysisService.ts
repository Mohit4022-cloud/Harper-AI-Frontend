import { SentimentScore, SentimentAnalysis, SentimentTimeline } from '@/types/advanced';

export class SentimentAnalysisService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async analyzeSentiment(text: string): Promise<SentimentScore> {
    // In production, this would use a sentiment analysis API
    // For now, use simple keyword-based analysis
    
    const positiveWords = [
      'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'good', 'nice', 'helpful', 'interested', 'excited',
      'love', 'perfect', 'awesome', 'definitely', 'absolutely'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'poor',
      'hate', 'dislike', 'problem', 'issue', 'difficult',
      'expensive', 'complicated', 'confused', 'frustrated', 'annoying'
    ];
    
    const textLower = text.toLowerCase();
    let score = 0;
    let magnitude = 0;
    
    // Count positive and negative words
    positiveWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 0.2;
        magnitude += 0.1;
      }
    });
    
    negativeWords.forEach(word => {
      if (textLower.includes(word)) {
        score -= 0.2;
        magnitude += 0.1;
      }
    });
    
    // Normalize score to -1 to 1 range
    score = Math.max(-1, Math.min(1, score));
    magnitude = Math.min(1, magnitude);
    
    // Determine label
    let label: 'positive' | 'neutral' | 'negative';
    if (score > 0.3) {
      label = 'positive';
    } else if (score < -0.3) {
      label = 'negative';
    } else {
      label = 'neutral';
    }
    
    return { score, magnitude, label };
  }

  async analyzeConversationSentiment(
    segments: Array<{ text: string; speaker: 'agent' | 'customer'; timestamp: number }>
  ): Promise<SentimentAnalysis> {
    const timeline: SentimentTimeline[] = [];
    let totalScore = 0;
    let customerScore = 0;
    let agentScore = 0;
    let customerCount = 0;
    let agentCount = 0;
    
    // Analyze each segment
    for (const segment of segments) {
      const sentiment = await this.analyzeSentiment(segment.text);
      
      timeline.push({
        timestamp: segment.timestamp,
        sentiment,
      });
      
      totalScore += sentiment.score;
      
      if (segment.speaker === 'customer') {
        customerScore += sentiment.score;
        customerCount++;
      } else {
        agentScore += sentiment.score;
        agentCount++;
      }
    }
    
    // Calculate averages
    const avgScore = segments.length > 0 ? totalScore / segments.length : 0;
    const avgCustomerScore = customerCount > 0 ? customerScore / customerCount : 0;
    const avgAgentScore = agentCount > 0 ? agentScore / agentCount : 0;
    
    return {
      overall: {
        score: avgScore,
        magnitude: 0.5, // Simplified for mock
        label: avgScore > 0.3 ? 'positive' : avgScore < -0.3 ? 'negative' : 'neutral',
      },
      timeline,
      customerSentiment: {
        score: avgCustomerScore,
        magnitude: 0.5,
        label: avgCustomerScore > 0.3 ? 'positive' : avgCustomerScore < -0.3 ? 'negative' : 'neutral',
      },
      agentSentiment: {
        score: avgAgentScore,
        magnitude: 0.5,
        label: avgAgentScore > 0.3 ? 'positive' : avgAgentScore < -0.3 ? 'negative' : 'neutral',
      },
    };
  }

  detectSentimentShifts(timeline: SentimentTimeline[]): Array<{
    timestamp: number;
    direction: 'positive' | 'negative';
    magnitude: number;
  }> {
    const shifts = [];
    
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1].sentiment;
      const curr = timeline[i].sentiment;
      const change = curr.score - prev.score;
      
      // Detect significant shifts (> 0.4 change)
      if (Math.abs(change) > 0.4) {
        shifts.push({
          timestamp: timeline[i].timestamp,
          direction: change > 0 ? 'positive' as const : 'negative' as const,
          magnitude: Math.abs(change),
        });
      }
    }
    
    return shifts;
  }

  generateSentimentSummary(analysis: SentimentAnalysis): string {
    const overall = analysis.overall.label;
    const customer = analysis.customerSentiment.label;
    const shifts = this.detectSentimentShifts(analysis.timeline);
    
    let summary = `The overall conversation sentiment was ${overall}. `;
    
    if (customer === 'positive') {
      summary += 'The customer responded positively throughout the call. ';
    } else if (customer === 'negative') {
      summary += 'The customer expressed concerns or dissatisfaction during the call. ';
    } else {
      summary += 'The customer maintained a neutral tone during the conversation. ';
    }
    
    if (shifts.length > 0) {
      const majorShifts = shifts.filter(s => s.magnitude > 0.6);
      if (majorShifts.length > 0) {
        summary += `There were ${majorShifts.length} significant sentiment shifts during the conversation. `;
      }
    }
    
    return summary;
  }
}

export default new SentimentAnalysisService();