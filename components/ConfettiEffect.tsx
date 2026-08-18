/**
 * components/ConfettiEffect.tsx
 * ─────────────────────────────────────────────────────────────────
 * Efecto de confetti en la página de donación exitosa.
 * Implementado con CSS puro para evitar dependencias pesadas.
 * Accesible: respeta prefers-reduced-motion.
 */

"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ec4899",
  "#3b82f6", "#f97316", "#14b8a6", "#8b5cf6",
];

const PARTICLE_COUNT = 120;

interface Particle {
  x:      number;
  y:      number;
  vx:     number;
  vy:     number;
  color:  string;
  size:   number;
  angle:  number;
  spin:   number;
  opacity: number;
  life:   number;
}

function createParticle(canvasWidth: number): Particle {
  return {
    x:       Math.random() * canvasWidth,
    y:       -10,
    vx:      (Math.random() - 0.5) * 6,
    vy:      Math.random() * 3 + 2,
    color:   COLORS[Math.floor(Math.random() * COLORS.length)],
    size:    Math.random() * 8 + 4,
    angle:   Math.random() * Math.PI * 2,
    spin:    (Math.random() - 0.5) * 0.3,
    opacity: 1,
    life:    Math.random() * 200 + 100,
  };
}

export function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respetar prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas  = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width)
    );

    let animFrame: number;
    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach((p, i) => {
        p.x      += p.vx;
        p.y      += p.vy;
        p.vy     += 0.08; // gravedad suave
        p.angle  += p.spin;
        p.life   -= 1;
        p.opacity = Math.max(0, p.life / 100);

        if (p.y > canvas.height || p.life <= 0) {
          particles[i] = createParticle(canvas.width);
          particles[i].y = -10;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle   = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
        ctx.restore();
      });

      // Detener después de 4 segundos
      if (frame < 240) {
        animFrame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    />
  );
}
