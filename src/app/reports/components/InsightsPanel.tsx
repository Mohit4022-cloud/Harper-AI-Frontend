'use client';

import { Insight } from '@/types/advanced';
import { Lightbulb, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InsightsPanelProps {
  insights: Insight[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="h-5 w-5" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'achievement':
        return <Trophy className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: Insight['type'], priority: Insight['priority']) => {
    if (priority === 'high') {
      switch (type) {
        case 'warning':
          return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        case 'opportunity':
          return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
        case 'achievement':
          return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        default:
          return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      }
    }
    
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI-Powered Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedInsights.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No insights available. Data will populate as you make calls.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedInsights.map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  'p-4 rounded-lg border transition-all hover:shadow-md',
                  getInsightColor(insight.type, insight.priority)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    {insight.metric && insight.value !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-medium opacity-75">
                          {insight.metric}:
                        </span>
                        <span className="text-sm font-bold">
                          {insight.value}
                        </span>
                      </div>
                    )}
                    
                    {insight.recommendation && (
                      <div className="mt-3 pt-3 border-t border-current/10">
                        <p className="text-xs font-medium mb-1">Recommendation:</p>
                        <p className="text-sm opacity-90">
                          {insight.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}