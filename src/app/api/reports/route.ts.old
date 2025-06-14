import { NextRequest } from 'next/server';
import { 
  withErrorHandler, 
  createApiResponse, 
  simulateDelay,
  AppError,
  ErrorTypes
} from '@/lib/errorHandler';
import { 
  generateMockMetrics,
  generateTrendData,
  generateTopPerformers
} from '@/lib/mockDataGenerators';

// GET /api/reports - Get analytics reports
export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const reportType = searchParams.get('type') || 'overview';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const groupBy = searchParams.get('groupBy') || 'day';
  
  // Validate date range
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  if (start > end) {
    throw new AppError(
      'Start date must be before end date',
      ErrorTypes.VALIDATION_ERROR,
      { startDate, endDate }
    );
  }
  
  // Simulate API delay
  await simulateDelay(600);
  
  // Generate report data based on type
  let reportData;
  
  switch (reportType) {
    case 'overview':
      reportData = generateMockMetrics({ start, end });
      break;
      
    case 'calls':
      reportData = {
        summary: {
          totalCalls: 2847,
          avgDuration: 4.3,
          connectRate: 0.32,
          bestTimeToCall: '10:00 AM - 12:00 PM',
          worstTimeToCall: '4:00 PM - 6:00 PM'
        },
        byOutcome: {
          connected: 912,
          voicemail: 743,
          no_answer: 892,
          busy: 187,
          failed: 113
        },
        bySentiment: {
          positive: 412,
          neutral: 387,
          negative: 113
        },
        trends: generateTrendData(30)
      };
      break;
      
    case 'performance':
      reportData = {
        team: generateTopPerformers(),
        leaderboard: {
          mostCalls: { name: 'Sarah Johnson', value: 487 },
          bestConnectRate: { name: 'Mike Chen', value: 0.42 },
          mostMeetings: { name: 'Emily Davis', value: 28 },
          highestRevenue: { name: 'John Smith', value: 187500 }
        },
        trends: generateTrendData(30)
      };
      break;
      
    case 'sentiment':
      reportData = {
        overall: {
          score: 0.24,
          trend: 'improving',
          change: 0.08
        },
        distribution: {
          veryPositive: 15,
          positive: 35,
          neutral: 30,
          negative: 15,
          veryNegative: 5
        },
        byTopic: {
          pricing: -0.12,
          features: 0.45,
          support: 0.67,
          competition: -0.23
        },
        trends: generateTrendData(30).map(day => ({
          ...day,
          sentiment: {
            positive: Math.random() * 50 + 25,
            neutral: Math.random() * 30 + 20,
            negative: Math.random() * 20 + 5
          }
        }))
      };
      break;
      
    default:
      throw new AppError(
        'Invalid report type',
        ErrorTypes.VALIDATION_ERROR,
        { validTypes: ['overview', 'calls', 'performance', 'sentiment'] }
      );
  }
  
  return createApiResponse(
    {
      type: reportType,
      dateRange: { start, end },
      groupBy,
      data: reportData
    },
    'Report generated successfully',
    { 
      generatedAt: new Date(),
      cacheExpiry: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
  );
});

// POST /api/reports/export - Export report data
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { format = 'csv', reportType, dateRange } = body;
  
  // Validate format
  if (!['csv', 'xlsx', 'pdf', 'json'].includes(format)) {
    throw new AppError(
      'Invalid export format',
      ErrorTypes.VALIDATION_ERROR,
      { validFormats: ['csv', 'xlsx', 'pdf', 'json'] }
    );
  }
  
  // Simulate export generation
  await simulateDelay(1500);
  
  // Generate export URL
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const exportUrl = `https://api.harperai.com/exports/${exportId}.${format}`;
  
  return createApiResponse(
    {
      exportId,
      url: exportUrl,
      format,
      size: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'ready'
    },
    'Export generated successfully',
    { reportType, dateRange }
  );
});