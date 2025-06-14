'use client';

import { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Hash, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DialerProps {
  onCall: (phoneNumber: string) => void;
  onEndCall: () => void;
  onToggleMute: (isMuted: boolean) => void;
  onToggleHold: (isOnHold: boolean) => void;
  isCallActive: boolean;
  isMuted: boolean;
  isOnHold: boolean;
}

export default function Dialer({
  onCall,
  onEndCall,
  onToggleMute,
  onToggleHold,
  isCallActive,
  isMuted,
  isOnHold,
}: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDialpad, setShowDialpad] = useState(false);

  const handleDialpadClick = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (phoneNumber.trim()) {
      onCall(phoneNumber);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCallActive) {
      handleCall();
    }
  };

  const dialpadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        {/* Phone Number Input */}
        <div className="flex gap-2">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isCallActive}
            className="text-lg"
          />
          <Button
            onClick={() => setShowDialpad(!showDialpad)}
            variant="outline"
            size="icon"
          >
            <Hash className="h-4 w-4" />
          </Button>
        </div>

        {/* Dialpad */}
        {showDialpad && !isCallActive && (
          <div className="grid grid-cols-3 gap-2">
            {dialpadButtons.flat().map((digit) => (
              <Button
                key={digit}
                variant="outline"
                onClick={() => handleDialpadClick(digit)}
                className="h-12 text-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                {digit}
              </Button>
            ))}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {!isCallActive ? (
            <Button
              onClick={handleCall}
              disabled={!phoneNumber.trim()}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onToggleMute(!isMuted)}
                variant={isMuted ? 'destructive' : 'secondary'}
                size="icon"
                className="h-12 w-12"
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                onClick={() => onToggleHold(!isOnHold)}
                variant="secondary"
                size="icon"
                className={cn("h-12 w-12", isOnHold && "bg-yellow-600 hover:bg-yellow-700 text-white")}
              >
                {isOnHold ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <Pause className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                onClick={onEndCall}
                variant="destructive"
                size="lg"
                className="px-8"
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                End Call
              </Button>
            </>
          )}
        </div>

        {/* Call Status */}
        {isCallActive && (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Call with
            </p>
            <p className="text-lg font-semibold">{phoneNumber}</p>
            {isMuted && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Microphone muted
              </p>
            )}
            {isOnHold && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Call on hold
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}