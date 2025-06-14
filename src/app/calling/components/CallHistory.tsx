import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Clock, TrendingUp, TrendingDown, Minus, MoreVertical } from 'lucide-react';
import { generateMockCall } from '@/lib/mockDataGenerators';

interface CallRecord {
  id: string;
  contactName: string;
  phoneNumber: string;
  duration: number;
  outcome: string;
  sentiment: string;
  sentimentScore: number;
  startTime: Date;
}

export default function CallHistory() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch call history
    const fetchCalls = async () => {
      try {
        const response = await fetch('/api/calls?limit=10');
        const { data } = await response.json();
        setCalls(data.calls);
      } catch (error) {
        // Fallback to mock data if API fails
        const mockCalls = Array.from({ length: 10 }, () => generateMockCall());
        setCalls(mockCalls);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalls();
  }, []);

  const getOutcomeIcon = (outcome: string) => {
    return outcome === 'connected' ? Phone : PhoneOff;
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'voicemail': return 'text-yellow-600 bg-yellow-100';
      case 'no_answer': return 'text-gray-600 bg-gray-100';
      case 'busy': return 'text-orange-600 bg-orange-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return TrendingUp;
    if (score < -0.3) return TrendingDown;
    return Minus;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {calls.map((call) => {
          const OutcomeIcon = getOutcomeIcon(call.outcome);
          const SentimentIcon = getSentimentIcon(call.sentimentScore);
          
          return (
            <div 
              key={call.id} 
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getOutcomeColor(call.outcome)}`}>
                  <OutcomeIcon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {call.contactName}
                    </h4>
                    {call.outcome === 'connected' && (
                      <SentimentIcon className={`h-4 w-4 ${getSentimentColor(call.sentimentScore)}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{call.phoneNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(call.duration)}
                    </span>
                    <span>•</span>
                    <span>{formatTime(call.startTime)}</span>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-center">
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          View All Call History
        </Button>
      </div>
    </Card>
  );
}