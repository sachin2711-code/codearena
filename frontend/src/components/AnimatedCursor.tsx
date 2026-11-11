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
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Only disable if device strictly lacks a mouse/pointer
    if (typeof window === 'undefined') return;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasPointer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const colors = ['#FFD93D', '#FF6B81', '#8ECAE6', '#FFF8E7', '#FF4757'];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastParticleTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      setIsActive(true);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`;
      }

      // Check if hovering an interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('a, button, input, select, textarea, [role="button"], tr, .cursor-pointer, .btn-shin-yellow, .btn-shin-red, .btn-shin-outline');
        setIsHovered(!!interactive);
      }

      // Spawn star particles on movement
      const now = performance.now();
      if (now - lastParticleTime > 35 && particles.length < 28) {
        lastParticleTime = now;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 5 + 4,
          opacity: 0.95,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          speedX: (Math.random() - 0.5) * 1.8,
          speedY: (Math.random() - 0.5) * 1.8 + 0.4,
        });
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      // Spawn click burst of stars
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 6 + 5,
          opacity: 1,
          color: '#FFD93D',
          rotation: Math.random() * Math.PI,
          speedX: Math.cos(angle) * 2.5,
          speedY: Math.sin(angle) * 2.5,
        });
      }
    };

    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => setIsActive(false);
    const onMouseEnter = () => setIsActive(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Star drawing helper
    const drawStar = (x: number, y: number, radius: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          Math.cos(((18 + i * 72) * Math.PI) / 180) * radius,
          -Math.sin(((18 + i * 72) * Math.PI) / 180) * radius
        );
        ctx.lineTo(
          Math.cos(((54 + i * 72) * Math.PI) / 180) * (radius / 2.2),
          -Math.sin(((54 + i * 72) * Math.PI) / 180) * (radius / 2.2)
        );
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
        p.opacity -= 0.038;
        p.size *= 0.95;
        p.rotation += 0.06;

        if (p.opacity <= 0 || p.size <= 0.6) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        drawStar(p.x, p.y, p.size, p.rotation);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Dynamic Star Trail Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[99998] select-none"
      />

      {/* Aesthetic Shinchan Cursor */}
      <div
        ref={cursorRef}
        className={`pointer-events-none fixed top-0 left-0 z-[99999] select-none transition-opacity duration-200 will-change-transform ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        <div
          className={`w-9 h-9 transition-transform duration-150 ease-out filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] ${
            isClicking ? 'scale-75' : isHovered ? 'scale-125 rotate-6' : 'scale-100'
          }`}
        >
          {isHovered ? (
            /* Interactive Hover: Chocobi Star Biscuit with Glowing Aura */
            <svg viewBox="0 0 36 36" fill="none" className="w-full h-full filter drop-shadow-[0_0_8px_#FF6B81]">
              {/* Star Cracker Body */}
              <polygon
                points="18,2 23,13 35,14 26,22 29,34 18,27.5 7,34 10,22 1,14 13,13"
                fill="#FF6B81"
                stroke="#2B2D42"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Inner yellow highlight */}
              <polygon
                points="18,6 21.5,14 30,14.5 23.5,20.5 25.5,29 18,24 10.5,29 12.5,20.5 6,14.5 14.5,14"
                fill="#FF85A2"
                opacity="0.5"
              />
              {/* Cute Face */}
              <circle cx="14" cy="18" r="1.8" fill="#2B2D42" />
              <circle cx="22" cy="18" r="1.8" fill="#2B2D42" />
              <path d="M 14.5 22 Q 18 25.5 21.5 22" stroke="#2B2D42" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Cheeks */}
              <circle cx="11" cy="20.5" r="1.4" fill="#FF3838" />
              <circle cx="25" cy="20.5" r="1.4" fill="#FF3838" />
            </svg>
          ) : (
            /* Default: Shinchan Iconic Face with Thick Arched Brows & Red Hero Band */
            <svg viewBox="0 0 36 36" fill="none" className="w-full h-full filter drop-shadow-[0_0_6px_rgba(255,217,61,0.5)]">
              {/* Shinchan Face Background */}
              <ellipse cx="18" cy="19" rx="15" ry="13" fill="#FFEAA7" stroke="#2B2D42" strokeWidth="2.5" />
              
              {/* Action Kamen Mini Red Visor */}
              <path d="M 5 15 C 10 9, 26 9, 31 15" stroke="#E63946" strokeWidth="3" strokeLinecap="round" />

              {/* Bold Iconic Wiggle Eyebrows */}
              <path d="M 7 12 C 10 8, 14 9, 16 11" stroke="#2B2D42" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 20 11 C 22 9, 26 8, 29 12" stroke="#2B2D42" strokeWidth="3.2" strokeLinecap="round" />

              {/* Big Anime Eyes */}
              <ellipse cx="12" cy="17" rx="3.5" ry="4" fill="#2B2D42" />
              <circle cx="11" cy="15.5" r="1.5" fill="#FFFFFF" />
              <ellipse cx="24" cy="17" rx="3.5" ry="4" fill="#2B2D42" />
              <circle cx="23" cy="15.5" r="1.5" fill="#FFFFFF" />

              {/* Chubby Rosy Cheeks */}
              <circle cx="7.5" cy="22" r="2.8" fill="#FF6B6B" opacity="0.85" />
              <circle cx="28.5" cy="22" r="2.8" fill="#FF6B6B" opacity="0.85" />

              {/* Open Cheerful Mouth */}
              <path d="M 14.5 22.5 Q 18 28 21.5 22.5 Z" fill="#E63946" stroke="#2B2D42" strokeWidth="1.8" />
              {/* Cute Little Tooth */}
              <ellipse cx="18" cy="23.5" rx="1.5" ry="1" fill="#FFFFFF" />
            </svg>
          )}
        </div>
      </div>
    </>
  );
};
export default AnimatedCursor;
