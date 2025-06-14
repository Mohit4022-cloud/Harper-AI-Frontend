import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { identity } = body;

    if (!identity) {
      return NextResponse.json({ error: 'Identity is required' }, { status: 400 });
    }

    // In production, use actual Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACmock';
    const apiKey = process.env.TWILIO_API_KEY || 'SKmock';
    const apiSecret = process.env.TWILIO_API_SECRET || 'mocksecret';
    const appSid = process.env.TWILIO_TWIML_APP_SID || 'APmock';

    // For development/demo, return a mock token
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.NODE_ENV === 'development') {
      const mockToken = jwt.sign(
        {
          identity,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
        'mock-secret'
      );

      return NextResponse.json({
        token: mockToken,
        identity,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
    }

    // In production, generate actual Twilio access token
    // This would use the Twilio Node.js SDK
    // const AccessToken = require('twilio').jwt.AccessToken;
    // const VoiceGrant = AccessToken.VoiceGrant;
    
    // const token = new AccessToken(accountSid, apiKey, apiSecret, {
    //   identity: identity,
    // });
    
    // const voiceGrant = new VoiceGrant({
    //   outgoingApplicationSid: appSid,
    //   incomingAllow: true,
    // });
    
    // token.addGrant(voiceGrant);
    
    // return NextResponse.json({
    //   token: token.toJwt(),
    //   identity,
    //   expiresAt: new Date(Date.now() + 3600000).toISOString(),
    // });

    // For now, return mock token
    const mockToken = jwt.sign(
      {
        identity,
        grants: {
          voice: {
            outgoing: { application_sid: appSid },
            incoming: { allow: true },
          },
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      apiSecret
    );

    return NextResponse.json({
      token: mockToken,
      identity,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}