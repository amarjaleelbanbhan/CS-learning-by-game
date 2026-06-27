'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/lib/fx/usePrefersReducedMotion';

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  drift: number;
  phase: number;
  hue: 'cyan' | 'violet' | 'gold';
}

const HUES: Record<Particle['hue'], string> = {
  cyan: '56,225,255',
  violet: '155,107,255',
  gold: '255,194,75',
};

const SPRITE_SIZE = 24;

/** Pre-renders one soft radial-glow sprite per hue so the per-frame draw is a
 * cheap drawImage blit instead of a live shadowBlur (which is expensive when
 * repeated for dozens of particles every frame and was stalling the GPU/main
 * thread). This is the standard trick for cheap glowing-particle canvases. */
function buildSprites(): Record<Particle['hue'], OffscreenCanvas | HTMLCanvasElement> {
  const sprites = {} as Record<Particle['hue'], OffscreenCanvas | HTMLCanvasElement>;
  for (const hue of Object.keys(HUES) as Particle['hue'][]) {
    const sprite =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(SPRITE_SIZE, SPRITE_SIZE)
        : document.createElement('canvas');
    if (!(sprite instanceof OffscreenCanvas)) {
      sprite.width = SPRITE_SIZE;
      sprite.height = SPRITE_SIZE;
    }
    const sctx = sprite.getContext('2d') as CanvasRenderingContext2D | null;
    if (sctx) {
      const c = SPRITE_SIZE / 2;
      const gradient = sctx.createRadialGradient(c, c, 0, c, c, c);
      gradient.addColorStop(0, `rgba(${HUES[hue]},0.9)`);
      gradient.addColorStop(0.4, `rgba(${HUES[hue]},0.5)`);
      gradient.addColorStop(1, `rgba(${HUES[hue]},0)`);
      sctx.fillStyle = gradient;
      sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    }
    sprites[hue] = sprite;
  }
  return sprites;
}

/**
 * Internal render scale: drawing at less than full device resolution and
 * letting CSS stretch the canvas cuts fill-rate cost roughly 3x for these
 * soft, blurry sprites with no visible quality loss — important because this
 * canvas covers the entire viewport and runs continuously behind everything
 * else, including measurement-sensitive libraries like React Flow (a
 * full-resolution redraw loop was once heavy enough to starve its
 * ResizeObserver-based node measurement — see git history for the incident).
 */
const RESOLUTION_SCALE = 0.6;
const MAX_PARTICLES = 40;

/**
 * Ambient drifting-mote background (Canvas2D). Purely decorative — fixed
 * behind all content, never intercepts pointer events, pauses when the tab is
 * hidden, and renders nothing for prefers-reduced-motion (NFR-A11Y-1).
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprites = buildSprites();
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;

    const resize = (): void => {
      canvas.width = Math.round(window.innerWidth * RESOLUTION_SCALE);
      canvas.height = Math.round(window.innerHeight * RESOLUTION_SCALE);
      const count = Math.min(MAX_PARTICLES, Math.round((canvas.width * canvas.height) / 14000));
      particles = Array.from({ length: count }, () => spawn(canvas.height));
    };

    const spawn = (height: number, atBottom = false): Particle => {
      const hues: Particle['hue'][] = ['cyan', 'cyan', 'cyan', 'violet', 'gold'];
      return {
        x: Math.random() * canvas.width,
        y: atBottom ? height + 10 : Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.12 + Math.random() * 0.3,
        drift: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        hue: hues[Math.floor(Math.random() * hues.length)]!,
      };
    };

    let t = 0;
    const tick = (): void => {
      if (!running) return;
      t += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.vy;
        p.x += p.drift + Math.sin(t + p.phase) * 0.15;
        if (p.y < -10) Object.assign(p, spawn(canvas.height, true));
        const twinkle = 0.5 + 0.5 * Math.sin(t * 1.5 + p.phase);
        const size = p.r * 9;
        ctx.globalAlpha = twinkle;
        ctx.drawImage(sprites[p.hue], p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = (): void => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    };

    resize();
    // Defer the first real frame by one tick: starting the continuous redraw
    // loop in the SAME pass as mount can collide with other libraries'
    // post-mount measurement (ResizeObserver) work on the page.
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(tick);
    });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
    />
  );
}
