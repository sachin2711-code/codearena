import React, { useEffect, useRef, useState } from 'react';

export const AnimatedCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePosition = useRef({ x: -100, y: -100 });
  const ringPosition = useRef({ x: -100, y: -100 });
  const isHovered = useRef(false);
  const isClicked = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable custom animated cursor on devices with fine pointer (mouse)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const onMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, select, textarea, [role="button"], tr, .cursor-pointer'
        );
        isHovered.current = !!interactive;
      }
    };

    const onMouseDown = () => {
      isClicked.current = true;
    };

    const onMouseUp = () => {
      isClicked.current = false;
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth animation loop for outer ring
    let animationFrameId: number;
    const render = () => {
      const { x: targetX, y: targetY } = mousePosition.current;
      const { x: currentX, y: currentY } = ringPosition.current;

      // Linear interpolation (lerp) for smooth trailing delay
      const speed = 0.18;
      const nextX = currentX + (targetX - currentX) * speed;
      const nextY = currentY + (targetY - currentY) * speed;

      ringPosition.current = { x: nextX, y: nextY };

      if (ringRef.current) {
        const scale = isClicked.current ? 0.75 : isHovered.current ? 1.6 : 1;
        const opacity = isHovered.current ? '0.9' : '0.45';
        const borderColor = isHovered.current ? '#FFD700' : '#FFE566';

        ringRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${scale})`;
        ringRef.current.style.opacity = opacity;
        ringRef.current.style.borderColor = borderColor;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Outer Spring Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -ml-4 -mt-4 w-8 h-8 rounded-full border border-shin-yellow/60 transition-[border-color,opacity] duration-150 ease-out will-change-transform"
        style={{
          boxShadow: isHovered.current ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
        }}
      />

      {/* Central Laser Point */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-shin-yellow will-change-transform shadow-[0_0_8px_rgba(255,215,0,0.9)]"
      />
    </div>
  );
};
