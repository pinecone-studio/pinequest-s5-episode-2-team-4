// Pixel art for the game canvases: shapes snap to a grid of art pixels, so
// the games draw chunky, crisp pixels instead of smooth curves and blurs.
// Answers stay crisp text on top. Swipe basketball and the penalty shootout
// started this style.

/** World units per art pixel. */
export const PIXEL = 4;

/** `v` rounded to the nearest multiple of `step`, so shapes land on the grid. */
export const snap = (v: number, step = PIXEL) => Math.round(v / step) * step;

/** A line of `size` art pixels from (x0, y0) to (x1, y1). */
export function pixelLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, size = PIXEL) {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / size);
  for (let i = 0; i <= steps; i++) {
    const f = steps ? i / steps : 0;
    ctx.fillRect(snap(x0 + (x1 - x0) * f, size), snap(y0 + (y1 - y0) * f, size), size, size);
  }
}

/** A box with its corners notched by one art pixel. */
export function pixelBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n = PIXEL) {
  ctx.fillRect(x + n, y, w - 2 * n, h);
  ctx.fillRect(x, y + n, w, h - 2 * n);
}

/** A filled circle of radius `r`, one row of art pixels at a time. */
export function pixelDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, size = PIXEL) {
  const x = snap(cx, size), y = snap(cy, size);
  const rows = Math.max(1, Math.round(r / size));
  for (let j = -rows; j < rows; j++) {
    const mid = (j + 0.5) * size;
    const cells = Math.round(Math.sqrt(Math.max(0, r * r - mid * mid)) / size);
    if (cells > 0) ctx.fillRect(x - cells * size, y + j * size, cells * 2 * size, size);
  }
}

/** Part of an ellipse in `size` art pixels, angles a0…a1. */
export function pixelArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, size = PIXEL) {
  const steps = Math.ceil(((a1 - a0) * Math.max(rx, ry)) / size);
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    ctx.fillRect(snap(cx + Math.cos(a) * rx, size), snap(cy + Math.sin(a) * ry, size), size, size);
  }
}
