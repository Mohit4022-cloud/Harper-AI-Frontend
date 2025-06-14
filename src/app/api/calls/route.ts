import { NextRequest } from 'next/server';
import { 
  withErrorHandler, 
  createApiResponse, 
  simulateDelay,
  simulateRandomError,
  AppError,
  ErrorTypes
} from '@/lib/errorHandler';
import { 
  generateMockCall, 
  simulateApiResponse 
} from '@/lib/mockDataGenerators';

// GET /api/calls - List calls with filtering
export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const outcome = searchParams.get('outcome');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  
  // Simulate API delay
  await simulateDelay(400);
  
  // Simulate occasional errors in development
  if (process.env.NODE_ENV === 'development') {
    simulateRandomError(0.05); // 5% error rate
  }
  
  // Generate mock calls
  const totalCalls = 156;
  const calls = [];
  
  for (let i = 0; i < limit; i++) {
    const call = generateMockCall();
    
    // Apply filters
    if (outcome && call.outcome !== outcome) continue;
    if (dateFrom && new Date(call.startTime) < new Date(dateFrom)) continue;
    if (dateTo && new Date(call.startTime) > new Date(dateTo)) continue;
    
    calls.push(call);
  }
  
  return createApiResponse(
    {
      calls,
      pagination: {
        page,
        limit,
        total: totalCalls,
        totalPages: Math.ceil(totalCalls / limit)
      }
    },
    'Calls retrieved successfully',
    { filteredBy: { outcome, dateFrom, dateTo } }
  );
});

// POST /api/calls - Initiate a new call
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { phoneNumber, contactId, callType = 'outbound' } = body;
  
  // Validate input
  if (!phoneNumber) {
    throw new AppError(
      'Phone number is required',
      ErrorTypes.VALIDATION_ERROR,
      { field: 'phoneNumber' }
    );
  }
  
  // Simulate call initiation delay
  await simulateDelay(800);
  
  // Generate call session
  const callSession = {
    id: `call_${Date.now()}`,
    sid: `CA${Array(32).fill(0).map(() => Math.random().toString(36)[2]).join('')}`,
    phoneNumber,
    contactId,
    callType,
    status: 'initiating',
    createdAt: new Date(),
    twilioToken: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ 
      identity: 'agent_001',
      exp: Date.now() + 3600000 
    }))}`,
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };
  
  return createApiResponse(
    callSession,
    'Call initiated successfully',
    { provider: 'twilio', region: 'us1' }
  );
});

// GET /api/calls/:id - Get call details
export const getCallById = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  
  if (!id) {
    throw new AppError('Call ID is required', ErrorTypes.VALIDATION_ERROR);
  }
  
  await simulateDelay(300);
  
  // Generate detailed call data
  const call = generateMockCall(id);
  
  return createApiResponse(
    call,
    'Call details retrieved successfully'
  );
});

// PATCH /api/calls/:id - Update call (end call, update status)
export const updateCall = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  const body = await request.json();
  const { status, endReason } = body;
  
  if (!id) {
    throw new AppError('Call ID is required', ErrorTypes.VALIDATION_ERROR);
  }
  
  await simulateDelay(200);
  
  // Generate updated call data
  const call = generateMockCall(id);
  
  if (status === 'completed') {
    call.endTime = new Date();
    call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);
  }
  
  return createApiResponse(
    { ...call, status, endReason },
    'Call updated successfully'
  );
});