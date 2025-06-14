// Advanced Harper AI Types

// Calling Types
export interface Call {
  id: string;
  tenantId: string;
  userId: string;
  contactId: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  recordingUrl?: string;
  transcriptData?: TranscriptData;
  analyticsData?: CallAnalytics;
  status: CallStatus;
  direction: 'inbound' | 'outbound';
  phoneNumber: string;
  twilioSid?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';

export interface TranscriptData {
  fullTranscript: string;
  segments: TranscriptSegment[];
  summary?: string;
  keyMoments?: KeyMoment[];
}

export interface TranscriptSegment {
  id?: string;
  speaker: string;
  text: string;
  startTime: Date;
  endTime: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
  isPartial?: boolean;
}

export interface KeyMoment {
  type: 'objection' | 'pain_point' | 'competitor_mention' | 'pricing_discussion' | 'next_steps';
  text: string;
  timestamp: number;
  confidence: number;
}

export interface CallAnalytics {
  sentimentAnalysis: SentimentAnalysis;
  performanceScore: PerformanceScore;
  talkRatio: number;
  interruptionCount: number;
  silencePercentage: number;
  keywordsDetected: string[];
  complianceFlags?: ComplianceFlag[];
}

export interface SentimentAnalysis {
  overall: SentimentScore;
  timeline: SentimentTimeline[];
  customerSentiment: SentimentScore;
  agentSentiment: SentimentScore;
}

export interface SentimentScore {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'neutral' | 'negative';
}

export interface SentimentTimeline {
  timestamp: number;
  sentiment: SentimentScore;
}

export interface PerformanceScore {
  overall: number; // 0-100
  categories: {
    discovery: number;
    presentation: number;
    objectionHandling: number;
    closing: number;
    rapport: number;
  };
  methodologyCompliance?: {
    framework: 'BANT' | 'MEDDIC' | 'SPIN' | 'Challenger';
    score: number;
    missingElements: string[];
  };
}

export interface ComplianceFlag {
  type: 'dncViolation' | 'missingConsent' | 'inappropriateLanguage';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  details: string;
}

// Real-time Calling Interfaces
export interface CallSession {
  sessionId: string;
  twilioDevice?: any; // Twilio Device instance
  webrtcConnection?: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isRecording: boolean;
  isMuted: boolean;
  callQuality: CallQuality;
}

export interface CallQuality {
  connectionState: RTCPeerConnectionState;
  audioLevel: number;
  packetLoss: number;
  jitter: number;
  roundTripTime: number;
}

export interface CoachingCard {
  id: string;
  type: 'tip' | 'warning' | 'suggestion';
  title: string;
  content: string;
  triggerCondition: string;
  priority: 'low' | 'medium' | 'high';
  displayDuration?: number;
}

// Analytics & Reporting Types
export interface DashboardData {
  timeRange: TimeRange;
  metrics: MetricData[];
  charts: ChartData[];
  insights: Insight[];
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface MetricData {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
  description?: string;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'funnel' | 'scatter' | 'heatmap' | 'pie' | 'area';
  title: string;
  data: any[]; // Chart-specific data structure
  config: ChartConfig;
}

export interface ChartConfig {
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  legend?: boolean;
  interactive?: boolean;
  customTooltip?: boolean;
}

export interface AxisConfig {
  label: string;
  dataKey: string;
  type?: 'number' | 'category' | 'time';
  format?: string;
}

export interface Insight {
  id: string;
  type: 'performance' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  recommendation?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// AI & Intelligence Types
export interface AIConversationAnalysis {
  summary: string;
  actionItems: ActionItem[];
  followUpRecommendations: FollowUpRecommendation[];
  competitorMentions: CompetitorMention[];
  painPoints: PainPoint[];
  buyingSignals: BuyingSignal[];
  riskFactors: RiskFactor[];
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
}

export interface FollowUpRecommendation {
  timing: string; // e.g., "2 days", "1 week"
  channel: 'call' | 'email' | 'linkedin' | 'meeting';
  message: string;
  reasoning: string;
  successProbability: number;
}

export interface CompetitorMention {
  name: string;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: number;
}

export interface PainPoint {
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  potentialSolution?: string;
}

export interface BuyingSignal {
  type: 'timeline' | 'budget' | 'authority' | 'need' | 'urgency';
  strength: 'weak' | 'moderate' | 'strong';
  context: string;
  timestamp: number;
}

export interface RiskFactor {
  type: 'competitor' | 'budget' | 'timeline' | 'stakeholder' | 'technical';
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;
}

// Lead Scoring Types
export interface LeadScore {
  leadId: string;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: ScoreFactor[];
  predictedValue: number;
  conversionProbability: number;
  recommendedActions: string[];
  lastUpdated: Date;
}

export interface ScoreFactor {
  name: string;
  category: 'demographic' | 'behavioral' | 'engagement' | 'intent';
  weight: number;
  value: number;
  contribution: number;
  description: string;
}

// Integration Types
export interface CRMIntegration {
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  config: CRMConfig;
}

export interface CRMConfig {
  apiUrl: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  customFieldMappings?: FieldMapping[];
}

export interface FieldMapping {
  crmField: string;
  harperField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  transformFunction?: string;
}

// Event Types for Real-time Processing
export interface CallEvent {
  eventType: 'call_started' | 'call_ended' | 'sentiment_detected' | 'keyword_detected' | 'coaching_triggered';
  callId: string;
  tenantId: string;
  userId: string;
  timestamp: Date;
  payload: Record<string, any>;
}

// WebSocket Message Types
export interface WSMessage {
  type: 'transcription' | 'sentiment' | 'coaching' | 'metric_update' | 'error';
  callId: string;
  data: any;
  timestamp: Date;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// Queue Job Types
export interface QueueJob {
  id: string;
  type: 'transcription' | 'analytics' | 'crm_sync' | 'email_send';
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}