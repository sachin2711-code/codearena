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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-mono font-black text-sm tracking-wider transition-all ${
        isUrgent
          ? 'bg-shin-red/15 border-shin-red/40 text-shin-red animate-pulse'
          : 'bg-shin-yellow/10 border-shin-yellow/30 text-shin-yellow'
      }`}
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-shin-red' : 'text-shin-yellow'}`} />
      <span>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};
