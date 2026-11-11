import React from 'react';

interface ShinchanLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ShinchanLoader: React.FC<ShinchanLoaderProps> = ({
  text = 'Shinchan is warming up the arena...',
  size = 'md',
}) => {
  const boxSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
      {/* Bouncing Chocobi Box with Spinning Star */}
      <div className={`relative ${boxSize} animate-shin-bounce`}>
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
          {/* Green Hexagonal Box */}
          <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="#55EFC4" stroke="#2B2D42" strokeWidth="4" />
          <polygon points="50,10 85,25 50,40 15,25" fill="#81ECEC" stroke="#2B2D42" strokeWidth="3" />
          {/* Pink Dino face */}
          <circle cx="50" cy="58" r="18" fill="#FF7675" stroke="#2B2D42" strokeWidth="3" />
          <circle cx="44" cy="54" r="2.5" fill="#2B2D42" />
          <circle cx="56" cy="54" r="2.5" fill="#2B2D42" />
          <path d="M 46 63 Q 50 67 54 63" stroke="#2B2D42" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>

        {/* Orbiting Yellow Star */}
        <div className="absolute -top-1 -right-1 w-5 h-5 animate-spin">
          <svg viewBox="0 0 32 32">
            <polygon
              points="16,2 20.5,11.5 31,12.5 23,19.5 25.5,30 16,24.5 6.5,30 9,19.5 1,12.5 11.5,11.5"
              fill="#FFD93D"
              stroke="#2B2D42"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {text && (
        <p className="font-bangers tracking-wider text-shin-yellow text-sm sm:text-base animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
