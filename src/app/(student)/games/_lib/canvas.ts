// Canvas helpers shared by the games. Each game draws in its own fixed
// "world" size (for example 400 × 500) and the canvas scales that world to
// whatever size CSS gives it, sharp on high-DPI screens.

export type Stage = {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels per world unit. */
  scale: number;
  /** Device pixel ratio the backing store was sized for. */
  dpr: number;
};

/** Resizes the canvas backing store to its CSS size and maps world units onto it. */
export function fitCanvas(canvas: HTMLCanvasElement, worldWidth: number): Stage {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const scale = rect.width / worldWidth;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  return { ctx, scale, dpr };
}

/** Pointer position in world units. */
export function toWorld(canvas: HTMLCanvasElement, scale: number, e: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
}

/**
 * Runs `frame(dt)` every animation frame; dt is in seconds, capped so a hidden tab doesn't jump.
 * The next frame is booked first, so one frame that throws can't stop the game.
 */
export function startLoop(frame: (dt: number) => void) {
  let last = performance.now();
  let id = requestAnimationFrame(function tick(now) {
    id = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame(dt);
  });
  return () => cancelAnimationFrame(id);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
