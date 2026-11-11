import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  rotation: number;
  speedX: number;
  speedY: number;
}

export const AnimatedCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const isHovered = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Disable custom cursor on touch devices or if user prefers reduced motion
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const colors = ['#FFD93D', '#E63946', '#8ECAE6', '#FFF8E7'];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastParticleTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`;
      }

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('a, button, input, select, textarea, [role="button"], tr, .cursor-pointer');
        isHovered.current = !!interactive;
      }

      // Spawn trail particles throttled
      const now = performance.now();
      if (now - lastParticleTime > 40 && particles.length < 24) {
        lastParticleTime = now;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 6 + 4,
          opacity: 0.9,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: (Math.random() - 0.5) * 1.5 - 0.5,
        });
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Render loop for star trail
    const drawStar = (x: number, y: number, radius: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * radius, -Math.sin(((18 + i * 72) * Math.PI) / 180) * radius);
        ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (radius / 2), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (radius / 2));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity -= 0.035;
        p.size *= 0.96;
        p.rotation += 0.05;

        if (p.opacity <= 0 || p.size <= 0.5) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        drawStar(p.x, p.y, p.size, p.rotation);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Particle Canvas for Star Trails */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9998] select-none"
      />

      {/* Shinchan SVG Cursor */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] select-none transition-transform duration-75 ease-out will-change-transform"
      >
        {isHovered.current ? (
          /* Chocobi Pink Star Cracker Cursor (Interactive) */
          <div className="w-8 h-8 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform scale-110 rotate-12 transition-transform">
            <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
              {/* Pink Star Cracker */}
              <polygon
                points="16,2 20.5,11.5 31,12.5 23,19.5 25.5,30 16,24.5 6.5,30 9,19.5 1,12.5 11.5,11.5"
                fill="#FF6B81"
                stroke="#2B2D42"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Inner cute face */}
              <circle cx="12" cy="15" r="1.5" fill="#2B2D42" />
              <circle cx="20" cy="15" r="1.5" fill="#2B2D42" />
              <path d="M 13 19 Q 16 22 19 19" stroke="#2B2D42" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Cheek blush */}
              <circle cx="9.5" cy="17" r="1" fill="#FF4757" opacity="0.8" />
              <circle cx="22.5" cy="17" r="1" fill="#FF4757" opacity="0.8" />
            </svg>
          </div>
        ) : (
          /* Shinchan Iconic Round Face Cursor (Default) */
          <div className="w-8 h-8 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
              {/* Face base */}
              <ellipse cx="16" cy="17" rx="13" ry="11" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="2" />
              {/* Thick Iconic Eyebrows */}
              <path d="M 6 10 C 9 6, 13 7, 14 9" stroke="#2B2D42" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 18 9 C 19 7, 23 6, 26 10" stroke="#2B2D42" strokeWidth="2.8" strokeLinecap="round" />
              {/* Large Comic Eyes */}
              <ellipse cx="10" cy="15" rx="3" ry="3.5" fill="#2B2D42" />
              <circle cx="9" cy="14" r="1.2" fill="#FFFFFF" />
              <ellipse cx="22" cy="15" rx="3" ry="3.5" fill="#2B2D42" />
              <circle cx="21" cy="14" r="1.2" fill="#FFFFFF" />
              {/* Chubby Rosy Cheeks */}
              <circle cx="6" cy="19" r="2.2" fill="#FF6B6B" opacity="0.75" />
              <circle cx="26" cy="19" r="2.2" fill="#FF6B6B" opacity="0.75" />
              {/* Playful Open Mouth */}
              <path d="M 13 20 Q 16 24 19 20 Z" fill="#E63946" stroke="#2B2D42" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
};
