"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PetElement } from "@/lib/types";
import { EFFECTS, newParticle, type Particle } from "./elementParticles";
import "./ElementRing.css";

type ElementRingProps = {
  element: PetElement;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * A round frame whose ring and particles match the pet's element: embers,
 * bubbles, leaves, snow, wind, sparks, pebbles or smoke. Particles are drawn
 * on a canvas twice the chip's size so they can spill past its edge.
 */
export function ElementRing({ element, className, style, children }: ElementRingProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const size = host.offsetWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = size * 2 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const r = size / 2;
    const k = r / 40;
    const fx = EFFECTS[element];
    const parts: Particle[] = [];
    const push = (init: Parameters<typeof newParticle>[0]) => {
      if (parts.length < fx.cap) parts.push(newParticle(init));
    };

    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;

      for (let n = fx.rate * dt; n > 0; n -= 1) {
        if (Math.random() < Math.min(1, n)) fx.spawn(push, r, k);
      }

      ctx.clearRect(0, 0, size * 2, size * 2);
      ctx.save();
      ctx.translate(size, size);
      ctx.globalCompositeOperation = fx.blend ?? "source-over";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.max) {
          parts[i] = parts[parts.length - 1];
          parts.pop();
          continue;
        }
        fx.step(p, dt, k);
        fx.draw(ctx, p, k, r);
      }
      ctx.restore();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [element]);

  return (
    <div ref={hostRef} data-element={element} className={cn("el-ring", className)} style={style}>
      <span className="el-body">{children}</span>
      <canvas ref={canvasRef} aria-hidden="true" className="el-fx" />
    </div>
  );
}
