import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 120; // less than 2 mins

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wider transition-colors ${
        isUrgent
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
          : 'bg-gray-800/80 border-gray-700/80 text-gray-200'
      }`}
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : 'text-purple-400'}`} />
      <span>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};
