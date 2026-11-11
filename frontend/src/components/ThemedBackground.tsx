import React, { useState } from 'react';
import { SHINCHAN_THEME } from '../theme/shinchanTheme';

export type BackgroundVariant = 'home' | 'login' | 'dashboard' | 'battle' | 'leaderboard' | 'history' | 'error';

interface ThemedBackgroundProps {
  variant?: BackgroundVariant;
  children?: React.ReactNode;
  className?: string;
}

// Built-in vector sticker illustrations as fallbacks if PNG files aren't in /public/assets/sinchan/
const StickerShinchanWaving = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    <ellipse cx="50" cy="45" rx="35" ry="30" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="4" />
    <path d="M 22 28 C 30 18, 40 20, 44 24" stroke="#2B2D42" strokeWidth="6" strokeLinecap="round" />
    <path d="M 56 24 C 60 20, 70 18, 78 28" stroke="#2B2D42" strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="34" cy="40" rx="8" ry="9" fill="#2B2D42" />
    <circle cx="31" cy="37" r="3" fill="#FFF" />
    <ellipse cx="66" cy="40" rx="8" ry="9" fill="#2B2D42" />
    <circle cx="63" cy="37" r="3" fill="#FFF" />
    <circle cx="20" cy="52" r="6" fill="#FF6B6B" opacity="0.8" />
    <circle cx="80" cy="52" r="6" fill="#FF6B6B" opacity="0.8" />
    <path d="M 40 54 Q 50 68 60 54 Z" fill="#E63946" stroke="#2B2D42" strokeWidth="4" />
    {/* Red Shirt */}
    <path d="M 25 72 L 75 72 L 82 100 L 18 100 Z" fill="#E63946" stroke="#2B2D42" strokeWidth="4" />
    {/* Yellow Shorts */}
    <rect x="30" y="92" width="40" height="8" fill="#FFD93D" stroke="#2B2D42" strokeWidth="3" />
  </svg>
);

const StickerChocobiBox = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    {/* Green Hexagonal Box */}
    <polygon points="50,10 85,25 85,75 50,90 15,75 15,25" fill="#55EFC4" stroke="#2B2D42" strokeWidth="4" />
    <polygon points="50,10 85,25 50,40 15,25" fill="#81ECEC" stroke="#2B2D42" strokeWidth="3" />
    {/* Pink Dinosaur Badge */}
    <circle cx="50" cy="58" r="20" fill="#FF7675" stroke="#2B2D42" strokeWidth="3" />
    {/* Dino Eyes & Smile */}
    <circle cx="44" cy="54" r="3" fill="#2B2D42" />
    <circle cx="56" cy="54" r="3" fill="#2B2D42" />
    <path d="M 45 64 Q 50 68 55 64" stroke="#2B2D42" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Star Cracker */}
    <polygon points="50,32 53,38 60,39 55,44 56,51 50,47 44,51 45,44 40,39 47,38" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="1.5" />
  </svg>
);

const StickerShiroDog = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    {/* Fluffy white ball head */}
    <circle cx="50" cy="50" r="34" fill="#FFFFFF" stroke="#2B2D42" strokeWidth="4" />
    {/* Floppy Ears */}
    <ellipse cx="20" cy="46" rx="10" ry="16" fill="#F0F0F0" stroke="#2B2D42" strokeWidth="3.5" transform="rotate(-15 20 46)" />
    <ellipse cx="80" cy="46" rx="10" ry="16" fill="#F0F0F0" stroke="#2B2D42" strokeWidth="3.5" transform="rotate(15 80 46)" />
    {/* Tiny Eyes */}
    <circle cx="40" cy="46" r="4" fill="#2B2D42" />
    <circle cx="60" cy="46" r="4" fill="#2B2D42" />
    {/* Little Black Nose & Mouth */}
    <ellipse cx="50" cy="54" rx="4" ry="3" fill="#2B2D42" />
    <path d="M 50 57 L 50 62 M 45 62 Q 50 66 55 62" stroke="#2B2D42" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Red Collar */}
    <path d="M 30 78 Q 50 86 70 78" stroke="#E63946" strokeWidth="6" strokeLinecap="round" fill="none" />
  </svg>
);

const StickerActionKamen = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
    {/* Mask Base */}
    <circle cx="50" cy="50" r="35" fill="#219EBC" stroke="#2B2D42" strokeWidth="4" />
    {/* Gold A Antenna */}
    <polygon points="50,12 43,30 57,30" fill="#FFD93D" stroke="#2B2D42" strokeWidth="3" />
    {/* Eye Openings */}
    <polygon points="30,42 45,46 32,56" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="3" />
    <polygon points="70,42 55,46 68,56" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="3" />
    {/* Mouthpiece */}
    <path d="M 38 68 Q 50 78 62 68" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
  </svg>
);

interface StickerItemProps {
  src?: string;
  fallback: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FloatingSticker: React.FC<StickerItemProps> = ({ src, fallback, className, style }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={`pointer-events-none select-none transition-transform will-change-transform ${className || ''}`}
      style={style}
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt="Shinchan sticker"
          loading="lazy"
          className="w-full h-full object-contain filter drop-shadow-lg"
          onError={() => setImageFailed(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
};

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({
  variant = 'dashboard',
  children,
  className = '',
}) => {
  // Determine sticker configuration per page variant
  const renderStickers = () => {
    switch (variant) {
      case 'home':
        return (
          <>
            {/* Top-Right Shinchan Waving */}
            <FloatingSticker
              src="/assets/sinchan/shinchan-waving.png"
              fallback={<StickerShinchanWaving />}
              className="absolute top-8 right-6 sm:right-16 w-24 sm:w-36 h-24 sm:h-36 opacity-20 sm:opacity-25 animate-shin-float"
            />
            {/* Bottom-Left Shiro */}
            <FloatingSticker
              src="/assets/sinchan/shiro-dog.png"
              fallback={<StickerShiroDog />}
              className="absolute bottom-12 left-6 sm:left-14 w-20 sm:w-32 h-20 sm:h-32 opacity-20 sm:opacity-25 animate-shin-bounce"
              style={{ animationDelay: '1s' }}
            />
            {/* Top-Left Chocobi */}
            <FloatingSticker
              src="/assets/sinchan/chocobi-box.png"
              fallback={<StickerChocobiBox />}
              className="absolute top-24 left-4 sm:left-12 w-16 sm:w-28 h-16 sm:h-28 opacity-15 sm:opacity-20 animate-shin-wiggle"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        );

      case 'login':
        return (
          <>
            {/* Top-Center Big Action Kamen */}
            <FloatingSticker
              src="/assets/sinchan/action-kamen.png"
              fallback={<StickerActionKamen />}
              className="absolute top-10 right-1/4 w-28 sm:w-40 h-28 sm:h-40 opacity-15 sm:opacity-20 animate-shin-float"
            />
            {/* Bottom-Right Shinchan */}
            <FloatingSticker
              src="/assets/sinchan/shinchan-happy.png"
              fallback={<StickerShinchanWaving />}
              className="absolute bottom-10 right-10 w-24 sm:w-36 h-24 sm:h-36 opacity-20 sm:opacity-25 animate-shin-bounce"
            />
          </>
        );

      case 'battle':
        return (
          <>
            {/* Action Kamen in Battle Mode */}
            <FloatingSticker
              src="/assets/sinchan/action-kamen.png"
              fallback={<StickerActionKamen />}
              className="absolute top-14 left-4 w-16 sm:w-24 h-16 sm:h-24 opacity-15 animate-shin-pulse"
            />
            <FloatingSticker
              src="/assets/sinchan/chocobi-box.png"
              fallback={<StickerChocobiBox />}
              className="absolute bottom-6 right-8 w-16 sm:w-24 h-16 sm:h-24 opacity-15 animate-shin-wiggle"
            />
          </>
        );

      case 'leaderboard':
        return (
          <>
            {/* Trophy winner Shinchan */}
            <FloatingSticker
              src="/assets/sinchan/shinchan-happy.png"
              fallback={<StickerShinchanWaving />}
              className="absolute top-8 right-12 w-24 sm:w-32 h-24 sm:h-32 opacity-20 animate-shin-bounce"
            />
            <FloatingSticker
              src="/assets/sinchan/shiro-dog.png"
              fallback={<StickerShiroDog />}
              className="absolute top-28 left-8 w-18 sm:w-28 h-18 sm:h-28 opacity-15 animate-shin-float"
            />
          </>
        );

      default:
        return (
          <>
            <FloatingSticker
              src="/assets/sinchan/shinchan-waving.png"
              fallback={<StickerShinchanWaving />}
              className="absolute top-10 right-8 w-20 sm:w-32 h-20 sm:h-32 opacity-20 animate-shin-float"
            />
            <FloatingSticker
              src="/assets/sinchan/chocobi-box.png"
              fallback={<StickerChocobiBox />}
              className="absolute bottom-12 left-10 w-16 sm:w-28 h-16 sm:h-28 opacity-15 animate-shin-wiggle"
            />
          </>
        );
    }
  };

  return (
    <div className={`relative min-h-[calc(100vh-3.5rem)] bg-shin-navy bg-doodle-pattern overflow-hidden ${className}`}>
      {/* Background Ambience Yellow & Blue Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[350px] bg-shin-yellow/6 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-shin-blue/6 rounded-full blur-[100px]" />

      {/* Layer 2: Floating Shinchan Stickers */}
      {renderStickers()}

      {/* Layer 3: Foreground Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};
