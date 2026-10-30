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
