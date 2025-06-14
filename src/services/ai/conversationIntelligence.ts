import { TranscriptSegment } from '@/types/transcript';
import { 
  AIConversationAnalysis, 
  ActionItem,
  FollowUpRecommendation,
  CompetitorMention,
  PainPoint,
  BuyingSignal,
  RiskFactor
} from '@/types/advanced';

export class ConversationIntelligenceService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async analyzeConversation(
    segments: TranscriptSegment[],
    context?: {
      contactName?: string;
      companyName?: string;
      dealSize?: number;
      productInterest?: string;
    }
  ): Promise<AIConversationAnalysis> {
    // In production, this would use GPT-4 for analysis
    // For now, return mock analysis based on segments
    
    const fullTranscript = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
    
    // Mock AI analysis
    const summary = this.generateSummary(segments);
    const actionItems = this.extractActionItems(segments);
    const followUpRecommendations = this.generateFollowUpRecommendations(segments, context);
    const competitorMentions = this.detectCompetitorMentions(segments);
    const painPoints = this.identifyPainPoints(segments);
    const buyingSignals = this.detectBuyingSignals(segments);
    const riskFactors = this.assessRiskFactors(segments, context);

    return {
      summary,
      actionItems,
      followUpRecommendations,
      competitorMentions,
      painPoints,
      buyingSignals,
      riskFactors,
    };
  }

  private generateSummary(segments: TranscriptSegment[]): string {
    // Mock summary generation
    const topics = new Set<string>();
    segments.forEach(segment => {
      if (segment.keywords) {
        segment.keywords.forEach(keyword => topics.add(keyword));
      }
    });

    return `The conversation covered ${topics.size} main topics including ${Array.from(topics).slice(0, 3).join(', ')}. The customer showed interest in learning more about Harper AI's capabilities and pricing. Key discussion points included real-time AI coaching, sentiment analysis, and integration options.`;
  }

  private extractActionItems(segments: TranscriptSegment[]): ActionItem[] {
    const actionItems: ActionItem[] = [];

    // Look for commitment language patterns
    segments.forEach((segment, index) => {
      const text = segment.text.toLowerCase();
      
      if (segment.speaker === 'agent') {
        if (text.includes('i will send') || text.includes("i'll send")) {
          actionItems.push({
            id: `action_${index}`,
            description: 'Send follow-up information as discussed',
            priority: 'high',
            status: 'pending',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          });
        }
        
        if (text.includes('schedule') || text.includes('set up a meeting')) {
          actionItems.push({
            id: `action_${index}_meeting`,
            description: 'Schedule follow-up meeting',
            priority: 'high',
            status: 'pending',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days
          });
        }
      }
    });

    // Always include a follow-up action
    if (actionItems.length === 0) {
      actionItems.push({
        id: 'action_default',
        description: 'Follow up with customer within 48 hours',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    }

    return actionItems;
  }

  private generateFollowUpRecommendations(
    segments: TranscriptSegment[],
    context?: any
  ): FollowUpRecommendation[] {
    const recommendations: FollowUpRecommendation[] = [];

    // Analyze sentiment trend
    const avgSentiment = segments.reduce((acc, seg) => 
      acc + (seg.sentiment?.score || 0), 0
    ) / segments.length;

    if (avgSentiment > 0.6) {
      recommendations.push({
        timing: '24 hours',
        channel: 'email',
        message: 'Thank them for their time and send the requested information about Harper AI\'s pricing and implementation timeline.',
        reasoning: 'High positive sentiment indicates strong interest. Strike while the iron is hot.',
        successProbability: 0.75,
      });
    } else if (avgSentiment > 0.3) {
      recommendations.push({
        timing: '2 days',
        channel: 'email',
        message: 'Send a personalized email addressing their specific concerns and offering a demo focused on their use case.',
        reasoning: 'Neutral sentiment suggests they need more information to make a decision.',
        successProbability: 0.6,
      });
    } else {
      recommendations.push({
        timing: '1 week',
        channel: 'linkedin',
        message: 'Connect on LinkedIn with a personalized message referencing your conversation and sharing a relevant case study.',
        reasoning: 'Low sentiment requires a softer touch. Build relationship before pushing for next steps.',
        successProbability: 0.4,
      });
    }

    return recommendations;
  }

  private detectCompetitorMentions(segments: TranscriptSegment[]): CompetitorMention[] {
    const competitors = ['Salesforce', 'HubSpot', 'Outreach', 'Salesloft', 'Gong'];
    const mentions: CompetitorMention[] = [];

    segments.forEach((segment, index) => {
      competitors.forEach(competitor => {
        if (segment.text.toLowerCase().includes(competitor.toLowerCase())) {
          mentions.push({
            name: competitor,
            context: segment.text,
            sentiment: segment.sentiment?.label || 'neutral',
            timestamp: typeof segment.startTime === 'number' ? segment.startTime : segment.startTime.getTime() / 1000,
          });
        }
      });
    });

    return mentions;
  }

  private identifyPainPoints(segments: TranscriptSegment[]): PainPoint[] {
    const painPoints: PainPoint[] = [];
    const painKeywords = ['problem', 'issue', 'challenge', 'difficult', 'struggle', 'pain', 'frustrat'];

    segments.forEach((segment) => {
      const text = segment.text.toLowerCase();
      
      painKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          painPoints.push({
            description: `Customer mentioned: "${segment.text.substring(0, 100)}..."`,
            severity: segment.sentiment?.label === 'negative' ? 'high' : 'medium',
            category: 'Process inefficiency',
            potentialSolution: 'Harper AI can automate this process and provide real-time insights',
          });
        }
      });
    });

    return painPoints;
  }

  private detectBuyingSignals(segments: TranscriptSegment[]): BuyingSignal[] {
    const signals: BuyingSignal[] = [];
    const buyingPatterns = {
      timeline: ['when', 'timeline', 'how soon', 'implement', 'start'],
      budget: ['cost', 'price', 'budget', 'invest', 'afford'],
      authority: ['decision', 'approve', 'stakeholder', 'team'],
      need: ['need', 'require', 'must have', 'looking for'],
      urgency: ['urgent', 'asap', 'quickly', 'immediate'],
    };

    segments.forEach((segment) => {
      const text = segment.text.toLowerCase();
      
      Object.entries(buyingPatterns).forEach(([type, keywords]) => {
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            signals.push({
              type: type as BuyingSignal['type'],
              strength: segment.sentiment?.score && segment.sentiment.score > 0.5 ? 'strong' : 'moderate',
              context: segment.text,
              timestamp: typeof segment.startTime === 'number' ? segment.startTime : segment.startTime.getTime() / 1000,
            });
          }
        });
      });
    });

    return signals;
  }

  private assessRiskFactors(segments: TranscriptSegment[], context?: any): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Check for competitor mentions
    if (this.detectCompetitorMentions(segments).length > 0) {
      risks.push({
        type: 'competitor',
        description: 'Customer mentioned competing solutions',
        severity: 'medium',
        mitigation: 'Highlight unique differentiators and provide comparison documentation',
      });
    }

    // Check for budget concerns
    const budgetConcerns = segments.some(s => 
      s.text.toLowerCase().includes('expensive') || 
      s.text.toLowerCase().includes('budget constraint')
    );
    
    if (budgetConcerns) {
      risks.push({
        type: 'budget',
        description: 'Customer expressed budget concerns',
        severity: 'high',
        mitigation: 'Discuss ROI and offer flexible pricing options',
      });
    }

    // Check for decision-making complexity
    const multipleStakeholders = segments.some(s => 
      s.text.toLowerCase().includes('team') || 
      s.text.toLowerCase().includes('discuss with')
    );
    
    if (multipleStakeholders) {
      risks.push({
        type: 'stakeholder',
        description: 'Multiple stakeholders involved in decision',
        severity: 'medium',
        mitigation: 'Offer team presentation and provide materials for internal sharing',
      });
    }

    return risks;
  }

  async generateCoachingInsights(
    segments: TranscriptSegment[],
    metrics: {
      talkRatio: number;
      interruptionCount: number;
      silencePercentage: number;
    }
  ): Promise<string[]> {
    const insights: string[] = [];

    // Talk ratio coaching
    if (metrics.talkRatio > 70) {
      insights.push('You spoke for over 70% of the call. Try to ask more open-ended questions and give the customer more time to share their thoughts.');
    } else if (metrics.talkRatio < 30) {
      insights.push('You spoke less than 30% of the time. While listening is important, make sure you\'re actively guiding the conversation and providing value.');
    }

    // Interruption coaching
    if (metrics.interruptionCount > 5) {
      insights.push(`You interrupted the customer ${metrics.interruptionCount} times. Practice active listening and wait for natural pauses before speaking.`);
    }

    // Question analysis
    const questions = segments.filter(s => 
      s.speaker === 'agent' && s.text.includes('?')
    ).length;
    
    if (questions < 3) {
      insights.push('Ask more discovery questions to better understand the customer\'s needs and pain points.');
    }

    // Positive reinforcement
    const positiveSegments = segments.filter(s => 
      s.sentiment?.label === 'positive'
    ).length;
    
    if (positiveSegments > segments.length * 0.6) {
      insights.push('Great job maintaining a positive conversation tone! The customer responded well to your approach.');
    }

    return insights;
  }
}

export default new ConversationIntelligenceService();