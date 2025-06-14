'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, AlertTriangle, Target, X, ChevronRight } from 'lucide-react';
import { CoachingCard } from '@/types/advanced';
import { cn } from '@/lib/utils';

interface CoachingCardsProps {
  cards: CoachingCard[];
  onDismiss?: (cardId: string) => void;
  onAction?: (cardId: string, action: string) => void;
}

export default function CoachingCards({
  cards,
  onDismiss,
  onAction,
}: CoachingCardsProps) {
  const [visibleCards, setVisibleCards] = useState<CoachingCard[]>([]);
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Filter out dismissed cards and sort by priority
    const activeCards = cards
      .filter(card => !dismissedCards.has(card.id))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 3); // Show max 3 cards

    setVisibleCards(activeCards);
  }, [cards, dismissedCards]);

  const handleDismiss = (cardId: string) => {
    setDismissedCards(prev => new Set(prev).add(cardId));
    onDismiss?.(cardId);
  };

  const getCardIcon = (type: CoachingCard['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'suggestion':
        return <Target className="h-5 w-5" />;
    }
  };

  const getCardStyle = (type: CoachingCard['type'], priority: CoachingCard['priority']) => {
    const baseStyle = 'relative p-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-102';
    
    if (priority === 'high') {
      switch (type) {
        case 'warning':
          return cn(baseStyle, 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800');
        case 'tip':
          return cn(baseStyle, 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800');
        case 'suggestion':
          return cn(baseStyle, 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800');
      }
    }
    
    return cn(baseStyle, 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700');
  };

  const getIconStyle = (type: CoachingCard['type']) => {
    switch (type) {
      case 'warning':
        return 'text-red-600 dark:text-red-400';
      case 'tip':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'suggestion':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (visibleCards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        AI Coaching Assistant
      </h3>
      
      {visibleCards.map((card) => (
        <div
          key={card.id}
          className={getCardStyle(card.type, card.priority)}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {/* Dismiss button */}
          <button
            onClick={() => handleDismiss(card.id)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className={cn('mt-0.5', getIconStyle(card.type))}>
              {getCardIcon(card.type)}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                {card.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {card.content}
              </p>
              
              {/* Action button if applicable */}
              {card.type === 'suggestion' && (
                <button
                  onClick={() => onAction?.(card.id, 'apply')}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Apply suggestion
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Auto-dismiss timer for low priority cards */}
          {card.priority === 'low' && card.displayDuration && (
            <div className="absolute bottom-0 left-0 h-1 bg-gray-300 dark:bg-gray-600 rounded-b-lg">
              <div
                className="h-full bg-gray-400 dark:bg-gray-500 rounded-b-lg"
                style={{
                  animation: `shrink ${card.displayDuration}ms linear forwards`,
                }}
              />
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}