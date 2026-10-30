import { describe, expect, it } from "vitest";
import { PIXEL, pixelBox, pixelLine, snap } from "./pixel";

/** A stand-in canvas that records the boxes drawn on it. */
function recorder() {
  const rects: [number, number, number, number][] = [];
  const ctx = { fillRect: (x: number, y: number, w: number, h: number) => rects.push([x, y, w, h]) };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, rects };
}

describe("snap", () => {
  it("rounds to the art pixel grid", () => {
    expect(snap(5)).toBe(4);
    expect(snap(6)).toBe(8);
    expect(snap(-3)).toBe(-4);
  });

  it("takes another grid step", () => {
    expect(snap(7, 3)).toBe(6);
    expect(snap(8, 3)).toBe(9);
  });
});

describe("pixelLine", () => {
  it("covers both ends with art pixels on the grid", () => {
    const { ctx, rects } = recorder();
    pixelLine(ctx, 0, 0, 16, 8);
    expect(rects[0]).toEqual([0, 0, PIXEL, PIXEL]);
    expect(rects.at(-1)).toEqual([16, 8, PIXEL, PIXEL]);
    expect(rects.every(([x, y]) => x % PIXEL === 0 && y % PIXEL === 0)).toBe(true);
  });

  it("draws one pixel for a point", () => {
    const { ctx, rects } = recorder();
    pixelLine(ctx, 8, 8, 8, 8);
    expect(rects).toEqual([[8, 8, PIXEL, PIXEL]]);
  });
});

describe("pixelBox", () => {
  it("is two overlapping boxes that leave the corners out", () => {
    const { ctx, rects } = recorder();
    pixelBox(ctx, 0, 0, 40, 20);
    expect(rects).toEqual([
      [4, 0, 32, 20],
      [0, 4, 40, 12],
    ]);
  });
});
