import { toWorld } from "../../_lib/canvas";
import type { Piece } from "./types";

type Point = { x: number; y: number };

type BladeHandlers = {
  /** Every point the finger passes, for the trail. */
  point: (p: Point) => void;
  /** The finger moved from a to b; a === b on the first touch. */
  segment: (a: Point, b: Point) => void;
  /** A fast stroke, for the swish sound. */
  swish: () => void;
};

/** The first live piece the stroke a→b crosses, and the angle to cut it at. */
export function firstHit(a: Point, b: Point, pieces: Piece[]) {
  const len = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(len / 5));
  // A tap has no direction; cut it diagonally.
  const ang = len > 3 ? Math.atan2(b.y - a.y, b.x - a.x) : -Math.PI / 4;
  for (const p of pieces) {
    if (!p.alive) continue;
    for (let i = 0; i <= steps; i++) {
      const x = a.x + ((b.x - a.x) * i) / steps, y = a.y + ((b.y - a.y) * i) / steps;
      if (Math.abs(x - p.x) < p.w / 2 + 4 && Math.abs(y - p.y) < p.h / 2 + 4) return { piece: p, ang };
    }
  }
}

/** Swiping (or tapping) on the field slices. Returns a function that removes the listeners. */
export function bindBlade(canvas: HTMLCanvasElement, scale: () => number, canSlice: () => boolean, on: BladeHandlers) {
  let prev: Point | null = null, lastSwish = 0;
  const down = (e: PointerEvent) => {
    if (!canSlice()) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    prev = toWorld(canvas, scale(), e);
    on.point(prev);
    on.segment(prev, prev);
  };
  const move = (e: PointerEvent) => {
    if (!prev || !canSlice()) return;
    const p = toWorld(canvas, scale(), e);
    on.point(p);
    // At most one swish every 0.15 s, or a long stroke turns into noise.
    if (Math.hypot(p.x - prev.x, p.y - prev.y) > 18 && e.timeStamp - lastSwish > 150) {
      lastSwish = e.timeStamp;
      on.swish();
    }
    on.segment(prev, p);
    prev = p;
  };
  const up = () => {
    prev = null;
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
  };
}
