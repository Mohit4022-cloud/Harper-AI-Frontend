import { Device } from '@twilio/voice-sdk';
import { v4 as uuidv4 } from 'uuid';
import { getPublicTwilioConfig } from '@/config/twilio';

export interface CallOptions {
  to: string;
  from?: string;
  recordingEnabled?: boolean;
  transcriptionEnabled?: boolean;
  customParameters?: Record<string, any>;
}

export interface TwilioTokenResponse {
  token: string;
  identity: string;
  expiresAt: string;
  isDevelopment?: boolean;
}

class TwilioService {
  private device: Device | null = null;
  private currentCall: any = null;
  private identity: string;

  constructor() {
    this.identity = `agent_${uuidv4()}`;
  }

  async initialize(): Promise<void> {
    try {
      const tokenResponse = await this.getAccessToken();
      this.device = new Device(tokenResponse.token, {
        codecPreferences: ['opus', 'pcmu'] as any,
        debug: true,
      } as any);

      this.setupDeviceListeners();
      await this.device.register();
      console.log('Twilio Device registered successfully');
    } catch (error) {
      console.error('Failed to initialize Twilio:', error);
      throw error;
    }
  }

  private async getAccessToken(): Promise<TwilioTokenResponse> {
    const response = await fetch('/api/twilio/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ identity: this.identity }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Twilio access token');
    }

    return response.json();
  }

  private setupDeviceListeners(): void {
    if (!this.device) return;

    this.device.on('registered', () => {
      console.log('Twilio Device ready to make calls');
    });

    this.device.on('error', (error: any) => {
      console.error('Twilio Device error:', error);
    });

    this.device.on('incoming', (call: any) => {
      console.log('Incoming call from', call.parameters.From);
      // Handle incoming call
    });
  }

  async makeCall(options: CallOptions): Promise<string> {
    if (!this.device) {
      throw new Error('Twilio Device not initialized');
    }

    const twilioConfig = getPublicTwilioConfig();
    if (!twilioConfig || !twilioConfig.isEnabled) {
      throw new Error('Twilio calling is not enabled');
    }

    try {
      const params: Record<string, string> = {
        To: options.to,
        From: options.from || twilioConfig.callerNumber || twilioConfig.phoneNumber,
        RecordingEnabled: String(options.recordingEnabled !== false), // Default true
        TranscriptionEnabled: String(options.transcriptionEnabled !== false), // Default true
        ...options.customParameters,
      };

      this.currentCall = await this.device.connect({ params });
      const callSid = this.currentCall.parameters.CallSid || `mock-${Date.now()}`;

      this.setupCallListeners(callSid);
      
      return callSid;
    } catch (error) {
      console.error('Failed to make call:', error);
      throw error;
    }
  }

  private setupCallListeners(callSid: string): void {
    if (!this.currentCall) return;

    this.currentCall.on('accept', () => {
      console.log('Call accepted');
      this.notifyCallEvent('call_started', callSid);
    });

    this.currentCall.on('disconnect', () => {
      console.log('Call disconnected');
      this.notifyCallEvent('call_ended', callSid);
      this.currentCall = null;
    });

    this.currentCall.on('cancel', () => {
      console.log('Call cancelled');
      this.currentCall = null;
    });

    this.currentCall.on('reject', () => {
      console.log('Call rejected');
      this.currentCall = null;
    });

    this.currentCall.on('volume', (inputVolume: number, outputVolume: number) => {
      // Handle volume changes for real-time audio level monitoring
      this.notifyCallEvent('volume_change', callSid, { inputVolume, outputVolume });
    });
  }

  async endCall(): Promise<void> {
    if (this.currentCall) {
      this.currentCall.disconnect();
    }
  }

  async muteCall(muted: boolean): Promise<void> {
    if (this.currentCall) {
      this.currentCall.mute(muted);
    }
  }

  async sendDigits(digits: string): Promise<void> {
    if (this.currentCall) {
      this.currentCall.sendDigits(digits);
    }
  }

  getCallStatus(): any {
    if (!this.currentCall) return null;

    return {
      status: this.currentCall.status(),
      isMuted: this.currentCall.isMuted(),
      direction: this.currentCall.direction,
      parameters: this.currentCall.parameters,
    };
  }

  private async notifyCallEvent(eventType: string, callSid: string, data?: any): Promise<void> {
    try {
      await fetch('/api/calls/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          eventType,
          callSid,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to notify call event:', error);
    }
  }

  destroy(): void {
    if (this.currentCall) {
      this.currentCall.disconnect();
    }
    if (this.device) {
      this.device.destroy();
    }
    this.device = null;
    this.currentCall = null;
  }
}

export default new TwilioService();