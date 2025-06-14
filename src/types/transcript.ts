/**
 * Transcript-related type definitions for Harper AI
 */

/**
 * Represents a single segment of a conversation transcript
 */
export interface TranscriptSegment {
  speaker: 'agent' | 'customer';
  startTime: number | Date;
  endTime: number | Date;
  text: string;
  sentiment: {
    score: number;
    magnitude?: number;
    label: 'positive' | 'neutral' | 'negative';
  };
  keywords?: string[];
}

/**
 * Complete transcript response
 */
export interface TranscriptResponse {
  segments: TranscriptSegment[];
  metadata?: {
    duration: number;
    language?: string;
    confidence?: number;
  };
}

/**
 * Utility function to normalize time values to numbers (milliseconds)
 */
export function normalizeTime(time: number | Date): number {
  return time instanceof Date ? time.getTime() : time;
}

/**
 * Utility function to format time for display
 */
export function formatTime(time: number | Date): string {
  const ms = normalizeTime(time);
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}