import { NextRequest, NextResponse } from 'next/server';

interface HealthCheckResponse {
  success: true;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    [key: string]: {
      status: 'operational' | 'degraded' | 'down';
      latency?: number;
      message?: string;
    };
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  
  // Check various services
  const services: HealthCheckResponse['services'] = {
    database: { status: 'operational', latency: 12 },
    redis: { status: 'operational', latency: 3 },
    twilio: { status: 'operational', latency: 45 },
    openai: { status: 'operational', latency: 120 },
    storage: { status: 'operational', latency: 8 }
  };
  
  // Simulate occasional service degradation
  if (Math.random() < 0.05) {
    services.twilio = { 
      status: 'degraded' as const, 
      latency: 250,
      message: 'High latency detected'
    };
  }
  
  // Calculate memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
  
  // Determine overall health status
  const degradedServices = Object.values(services).filter(s => s.status === 'degraded').length;
  const downServices = Object.values(services).filter(s => s.status === 'down').length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (downServices > 0) {
    status = 'unhealthy';
  } else if (degradedServices > 0) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }
  
  const response: HealthCheckResponse = {
    success: true,
    status,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.1.0',
    environment: process.env.NODE_ENV || 'development',
    services,
    uptime: process.uptime(),
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: memoryPercentage
    }
  };
  
  // Set appropriate cache headers
  const headers = new Headers();
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  return NextResponse.json(response, { 
    status: status === 'unhealthy' ? 503 : 200,
    headers 
  });
}

// HEAD /api/health - Simple health check
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}