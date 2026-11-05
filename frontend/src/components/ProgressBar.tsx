import React from 'react';

interface ProgressBarProps {
  passed: number;
  total: number;
  label: string;
  isOpponent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  passed,
  total,
  label,
  isOpponent = false,
}) => {
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1 w-full max-w-[200px]">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className={isOpponent ? 'text-amber-400' : 'text-purple-400'}>{label}</span>
        <span className="text-gray-400 font-mono">
          {passed}/{total} ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isOpponent
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-purple-500 to-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
