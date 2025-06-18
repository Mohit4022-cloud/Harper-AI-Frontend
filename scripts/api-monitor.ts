#!/usr/bin/env node

/**
 * API Health Monitoring Script
 * 
 * Monitors API endpoints for availability, performance, and health
 * Can be run as a cron job or GitHub Action
 */

import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface EndpointCheck {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus: number;
  maxResponseTime: number;
  requiresAuth: boolean;
  body?: any;
}

interface CheckResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  status?: number;
  error?: string;
  timestamp: string;
}

const API_BASE_URL = process.env.API_BASE_URL || 'https://harper-ai-frontend.onrender.com';
const AUTH_TOKEN = process.env.API_AUTH_TOKEN || '';

const endpoints: EndpointCheck[] = [
  // Health check
  {
    url: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    maxResponseTime: 1000,
    requiresAuth: false,
  },
  
  // Auth endpoints
  {
    url: '/api/auth/login',
    method: 'POST',
    expectedStatus: 200,
    maxResponseTime: 2000,
    requiresAuth: false,
    body: {
      email: 'monitor@example.com',
      password: 'monitor123',
    },
  },
  
  // Protected endpoints
  {
    url: '/api/contacts',
    method: 'GET',
    expectedStatus: 200,
    maxResponseTime: 3000,
    requiresAuth: true,
  },
  {
    url: '/api/analytics',
    method: 'GET',
    expectedStatus: 200,
    maxResponseTime: 5000,
    requiresAuth: true,
  },
  {
    url: '/api/settings',
    method: 'GET',
    expectedStatus: 200,
    maxResponseTime: 2000,
    requiresAuth: true,
  },
];

class APIMonitor {
  private authToken: string = AUTH_TOKEN;
  private results: CheckResult[] = [];

  async run() {
    console.log(`🔍 Starting API monitoring for ${API_BASE_URL}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

    // Get auth token if needed
    if (!this.authToken) {
      await this.authenticate();
    }

    // Check all endpoints
    for (const endpoint of endpoints) {
      await this.checkEndpoint(endpoint);
    }

    // Generate report
    this.generateReport();

    // Save results
    await this.saveResults();

    // Exit with appropriate code
    const hasFailures = this.results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
  }

  private async authenticate() {
    console.log('🔐 Authenticating...');
    
    const context = await request.newContext({
      baseURL: API_BASE_URL,
    });

    try {
      const response = await context.post('/api/auth/login', {
        data: {
          email: 'monitor@example.com',
          password: 'monitor123',
        },
      });

      if (response.ok()) {
        const data = await response.json();
        this.authToken = data.token;
        console.log('✅ Authentication successful\n');
      } else {
        console.error('❌ Authentication failed\n');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
    }

    await context.dispose();
  }

  private async checkEndpoint(check: EndpointCheck) {
    const context = await request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: check.requiresAuth && this.authToken
        ? { Authorization: `Bearer ${this.authToken}` }
        : {},
    });

    const startTime = Date.now();
    const result: CheckResult = {
      endpoint: `${check.method} ${check.url}`,
      success: false,
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(`Checking ${check.method} ${check.url}...`);
      
      const response = await context[check.method.toLowerCase()](check.url, {
        data: check.body,
        timeout: check.maxResponseTime + 5000, // Add buffer to timeout
      });

      result.responseTime = Date.now() - startTime;
      result.status = response.status();
      result.success = response.status() === check.expectedStatus && 
                      result.responseTime <= check.maxResponseTime;

      if (result.success) {
        console.log(`✅ Success (${result.responseTime}ms)`);
      } else if (response.status() !== check.expectedStatus) {
        console.log(`❌ Failed - Expected status ${check.expectedStatus}, got ${response.status()}`);
        result.error = `Unexpected status: ${response.status()}`;
      } else {
        console.log(`⚠️  Slow - Response time ${result.responseTime}ms exceeds ${check.maxResponseTime}ms`);
        result.error = `Slow response: ${result.responseTime}ms`;
      }

      // Log response body for debugging failed requests
      if (!result.success && response.status() !== 404) {
        try {
          const body = await response.text();
          console.log(`Response body: ${body.substring(0, 200)}...`);
        } catch (e) {
          // Ignore body parsing errors
        }
      }

    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.error = error.message;
      console.log(`❌ Error - ${error.message}`);
    }

    console.log('');
    this.results.push(result);
    await context.dispose();
  }

  private generateReport() {
    console.log('\n📊 Summary Report');
    console.log('================\n');

    const totalChecks = this.results.length;
    const successfulChecks = this.results.filter(r => r.success).length;
    const failedChecks = totalChecks - successfulChecks;
    const avgResponseTime = Math.round(
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks
    );

    console.log(`Total Checks: ${totalChecks}`);
    console.log(`✅ Successful: ${successfulChecks}`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log(`⏱️  Avg Response Time: ${avgResponseTime}ms\n`);

    if (failedChecks > 0) {
      console.log('Failed Endpoints:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`- ${r.endpoint}: ${r.error || 'Unknown error'}`);
        });
      console.log('');
    }

    // Performance issues
    const slowEndpoints = this.results.filter(r => r.responseTime > 3000);
    if (slowEndpoints.length > 0) {
      console.log('Slow Endpoints (>3s):');
      slowEndpoints.forEach(r => {
        console.log(`- ${r.endpoint}: ${r.responseTime}ms`);
      });
      console.log('');
    }
  }

  private async saveResults() {
    const resultsDir = path.join(process.cwd(), 'monitoring-results');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save detailed results
    const filename = `api-monitor-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(resultsDir, filename);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      baseUrl: API_BASE_URL,
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        avgResponseTime: Math.round(
          this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length
        ),
      },
      results: this.results,
    };

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`📁 Results saved to: ${filepath}`);

    // Update latest results symlink
    const latestPath = path.join(resultsDir, 'latest.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(filename, latestPath);

    // Cleanup old results (keep last 30 days)
    this.cleanupOldResults(resultsDir);
  }

  private cleanupOldResults(dir: string) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    fs.readdirSync(dir).forEach(file => {
      if (file.startsWith('api-monitor-') && file.endsWith('.json')) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(filepath);
          console.log(`🗑️  Cleaned up old result: ${file}`);
        }
      }
    });
  }
}

// Run the monitor
const monitor = new APIMonitor();
monitor.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});