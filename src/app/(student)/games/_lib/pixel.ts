// Pixel art for the game canvases: shapes snap to a grid of art pixels, so
// the games draw chunky, crisp pixels instead of smooth curves and blurs.
// Answers stay crisp text on top. Swipe basketball and the penalty shootout
// started this style.

/** World units per art pixel. */
export const PIXEL = 4;

/** `v` rounded to the nearest multiple of `step`, so shapes land on the grid. */
export const snap = (v: number, step = PIXEL) => Math.round(v / step) * step;
