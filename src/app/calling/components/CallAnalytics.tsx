'use client';

import { useEffect, useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  Clock,
  BarChart3,
  MessageSquare,
  Target
} from 'lucide-react';
import { CallAnalytics as ICallAnalytics, SentimentScore } from '@/types/advanced';
import { cn } from '@/lib/utils';

interface CallAnalyticsProps {
  analytics: ICallAnalytics | null;
  duration: number;
  isRealTime?: boolean;
}

export default function CallAnalytics({
  analytics,
  duration,
  isRealTime = false,
}: CallAnalyticsProps) {
  const [animatedValues, setAnimatedValues] = useState({
    talkRatio: 0,
    sentimentScore: 0,
    performanceScore: 0,
  });

  useEffect(() => {
    if (analytics) {
      // Animate values
      const timer = setTimeout(() => {
        setAnimatedValues({
          talkRatio: analytics.talkRatio,
          sentimentScore: (analytics.sentimentAnalysis.overall.score + 1) * 50, // Convert -1 to 1 scale to 0-100
          performanceScore: analytics.performanceScore.overall,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [analytics]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (score: number): string => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Call analytics will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          {isRealTime ? 'Live Analytics' : 'Call Analytics'}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          {formatDuration(duration)}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Talk Ratio */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Talk Ratio</span>
          </div>
          <div className="relative">
            <div className="text-2xl font-bold">{Math.round(animatedValues.talkRatio)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {animatedValues.talkRatio > 70 ? 'Too much talking' : 'Good balance'}
            </div>
          </div>
        </div>

        {/* Sentiment Score */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {animatedValues.sentimentScore >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">Sentiment</span>
          </div>
          <div className={cn('text-2xl font-bold', getSentimentColor(animatedValues.sentimentScore))}>
            {Math.round(animatedValues.sentimentScore)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.sentimentAnalysis.overall.label}
          </div>
        </div>

        {/* Interruptions */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Interruptions</span>
          </div>
          <div className="text-2xl font-bold">{analytics.interruptionCount}</div>
          <div className="text-xs text-gray-500 mt-1">
            {analytics.interruptionCount > 5 ? 'High' : 'Normal'}
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Performance</span>
          </div>
          <div className="text-2xl font-bold">{Math.round(animatedValues.performanceScore)}</div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full mt-2">
            <div
              className={cn('h-full rounded-full transition-all duration-1000', getPerformanceColor(animatedValues.performanceScore))}
              style={{ width: `${animatedValues.performanceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Performance Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Performance Breakdown
        </h4>
        <div className="space-y-2">
          {Object.entries(analytics.performanceScore.categories).map(([category, score]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000', getPerformanceColor(score))}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">{score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords Detected */}
      {analytics.keywordsDetected.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Keywords Detected
          </h4>
          <div className="flex flex-wrap gap-2">
            {analytics.keywordsDetected.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}