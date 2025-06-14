import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getTwilioConfig } from '@/config/twilio';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { identity } = body;

    if (!identity) {
      return NextResponse.json({ error: 'Identity is required' }, { status: 400 });
    }

    // Get Twilio configuration
    const twilioConfig = getTwilioConfig();
    
    if (!twilioConfig || !twilioConfig.isEnabled) {
      return NextResponse.json({ error: 'Twilio calling is not enabled' }, { status: 503 });
    }

    // For development/demo, return a mock token
    if (twilioConfig.isDevelopment) {
      const mockToken = jwt.sign(
        {
          identity,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          grants: {
            voice: {
              outgoing: { application_sid: twilioConfig.twimlAppSid },
              incoming: { allow: true },
            },
          },
        },
        'mock-secret'
      );

      return NextResponse.json({
        token: mockToken,
        identity,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isDevelopment: true,
      });
    }

    // In production, generate actual Twilio access token
    // TODO: Install and use Twilio SDK for production
    // npm install twilio
    // const AccessToken = require('twilio').jwt.AccessToken;
    // const VoiceGrant = AccessToken.VoiceGrant;
    
    // const token = new AccessToken(
    //   twilioConfig.accountSid, 
    //   twilioConfig.apiKey, 
    //   twilioConfig.apiSecret,
    //   { identity: identity }
    // );
    
    // const voiceGrant = new VoiceGrant({
    //   outgoingApplicationSid: twilioConfig.twimlAppSid,
    //   incomingAllow: true,
    // });
    
    // token.addGrant(voiceGrant);
    
    // return NextResponse.json({
    //   token: token.toJwt(),
    //   identity,
    //   expiresAt: new Date(Date.now() + 3600000).toISOString(),
    // });

    // For now, return mock token for production too
    const mockToken = jwt.sign(
      {
        identity,
        grants: {
          voice: {
            outgoing: { application_sid: twilioConfig.twimlAppSid },
            incoming: { allow: true },
          },
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      twilioConfig.apiSecret
    );

    return NextResponse.json({
      token: mockToken,
      identity,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      isDevelopment: false,
    });
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}