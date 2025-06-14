import { EventEmitter } from 'events';
import { TranscriptSegment, SentimentScore } from '@/types/transcript';

export interface TranscriptionConfig {
  apiKey: string;
  language?: string;
  model?: 'whisper-1';
  temperature?: number;
  enableSpeakerDiarization?: boolean;
  enableRealTime?: boolean;
}

export interface TranscriptionEvent {
  type: 'partial' | 'final' | 'error';
  segment?: TranscriptSegment;
  error?: Error;
}

export class TranscriptionService extends EventEmitter {
  private config: TranscriptionConfig;
  private audioProcessor: AudioProcessor | null = null;
  private websocket: WebSocket | null = null;
  private isTranscribing: boolean = false;

  constructor(config: TranscriptionConfig) {
    super();
    this.config = config;
  }

  async startRealTimeTranscription(stream: MediaStream, callId: string): Promise<void> {
    if (this.isTranscribing) {
      throw new Error('Transcription already in progress');
    }

    try {
      this.isTranscribing = true;
      
      // Initialize audio processor
      this.audioProcessor = new AudioProcessor(stream);
      this.audioProcessor.on('audio', (audioData: ArrayBuffer) => {
        this.sendAudioToWhisper(audioData, callId);
      });

      // Connect to WebSocket for real-time streaming
      await this.connectWebSocket(callId);
      
      // Start processing audio
      this.audioProcessor.start();
      
      console.log('Real-time transcription started for call:', callId);
    } catch (error) {
      this.isTranscribing = false;
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  private async connectWebSocket(callId: string): Promise<void> {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/transcription`;
    
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected for transcription');
      this.websocket?.send(JSON.stringify({
        type: 'init',
        callId,
        config: {
          language: this.config.language || 'en',
          model: this.config.model || 'whisper-1',
        },
      }));
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleTranscriptionResult(data);
      } catch (error) {
        console.error('Failed to parse transcription result:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.websocket.onclose = () => {
      console.log('WebSocket closed');
      if (this.isTranscribing) {
        // Attempt to reconnect
        setTimeout(() => this.connectWebSocket(callId), 1000);
      }
    };
  }

  private async sendAudioToWhisper(audioData: ArrayBuffer, callId: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Convert audio data to base64 for WebSocket transmission
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      this.websocket.send(JSON.stringify({
        type: 'audio',
        callId,
        audio: base64Audio,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to send audio data:', error);
    }
  }

  private handleTranscriptionResult(data: any): void {
    switch (data.type) {
      case 'partial':
        this.emit('partial', {
          type: 'partial',
          segment: data.segment,
        } as TranscriptionEvent);
        break;
        
      case 'final':
        this.emit('final', {
          type: 'final',
          segment: data.segment,
        } as TranscriptionEvent);
        break;
        
      case 'sentiment':
        this.emit('sentiment', data.sentiment);
        break;
        
      case 'error':
        this.emit('error', new Error(data.message));
        break;
    }
  }

  async stopTranscription(): Promise<void> {
    this.isTranscribing = false;
    
    if (this.audioProcessor) {
      this.audioProcessor.stop();
      this.audioProcessor = null;
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    console.log('Transcription stopped');
  }

  async transcribeRecording(audioUrl: string): Promise<TranscriptSegment[]> {
    try {
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          audioUrl,
          config: {
            language: this.config.language || 'en',
            model: this.config.model || 'whisper-1',
            enableSpeakerDiarization: this.config.enableSpeakerDiarization,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe recording');
      }

      const result = await response.json();
      return result.segments;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}

// Audio processor for real-time audio streaming
class AudioProcessor extends EventEmitter {
  private audioContext: AudioContext;
  private source: MediaStreamAudioSourceNode;
  private processor: ScriptProcessorNode;
  private isProcessing: boolean = false;

  constructor(stream: MediaStream) {
    super();
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      if (!this.isProcessing) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const audioData = this.float32ToInt16(inputData);
      this.emit('audio', audioData.buffer);
    };
  }

  start(): void {
    this.isProcessing = true;
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop(): void {
    this.isProcessing = false;
    this.source.disconnect();
    this.processor.disconnect();
    this.audioContext.close();
  }

  private float32ToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, buffer[i]) * 0x7FFF;
    }
    return buf;
  }
}

export default TranscriptionService;