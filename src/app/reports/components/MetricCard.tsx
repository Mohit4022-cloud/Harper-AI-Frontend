'use client';

import { MetricData } from '@/types/advanced';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: MetricData;
  className?: string;
}

export default function MetricCard({ metric, className }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!metric.trend) return null;
    
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!metric.trend || !metric.change) return 'text-gray-500';
    
    const isPositive = metric.change > 0;
    const isGoodTrend = metric.name.toLowerCase().includes('cost') ? !isPositive : isPositive;
    
    return isGoodTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const formatValue = (value: number): string => {
    if (metric.unit === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    if (metric.unit === 'percentage') {
      return `${value}%`;
    }
    
    if (metric.unit === 'time') {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {metric.name}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {formatValue(metric.value)}
          </p>
          
          {metric.previousValue !== undefined && metric.changePercentage !== undefined && (
            <div className={cn('flex items-center gap-2 mt-2', getTrendColor())}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                vs last period
              </span>
            </div>
          )}
          
          {metric.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {metric.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}