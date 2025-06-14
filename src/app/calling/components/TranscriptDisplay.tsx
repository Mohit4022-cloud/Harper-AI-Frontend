'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TranscriptSegment, SentimentScore } from '@/types/advanced';
import { cn } from '@/lib/utils';

interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
  isRealTime?: boolean;
  showSentiment?: boolean;
}

export default function TranscriptDisplay({
  segments,
  isRealTime = false,
  showSentiment = true,
}: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, autoScroll]);

  const getSentimentIcon = (sentiment: SentimentScore) => {
    switch (sentiment.label) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment: SentimentScore) => {
    switch (sentiment.label) {
      case 'positive':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'negative':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-l-gray-300 bg-gray-50 dark:bg-gray-800/50';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">
            {isRealTime ? 'Live Transcript' : 'Call Transcript'}
          </h3>
        </div>
        {isRealTime && (
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              'text-sm px-3 py-1 rounded-md transition-colors',
              autoScroll
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            Auto-scroll {autoScroll ? 'on' : 'off'}
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="h-96 overflow-y-auto space-y-3 pr-2"
        onScroll={() => {
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setAutoScroll(scrollTop + clientHeight >= scrollHeight - 50);
          }
        }}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg border-l-4 transition-all',
              showSentiment && segment.sentiment
                ? getSentimentColor(segment.sentiment)
                : 'border-l-transparent bg-gray-50 dark:bg-gray-800/50'
            )}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    segment.speaker === 'agent'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  )}
                >
                  {segment.speaker === 'agent' ? 'Agent' : 'Customer'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(segment.startTime)}
                </span>
              </div>
              {showSentiment && segment.sentiment && (
                <div className="flex items-center gap-1">
                  {getSentimentIcon(segment.sentiment)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(segment.sentiment.score * 100)}%
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {segment.text}
            </p>
            
            {segment.keywords && segment.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {segment.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isRealTime && segments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="text-sm">Waiting for conversation...</p>
          </div>
        )}
      </div>
    </div>
  );
}