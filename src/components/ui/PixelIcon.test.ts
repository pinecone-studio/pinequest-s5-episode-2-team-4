import { describe, expect, it } from "vitest";
import { PIXEL_ICONS } from "./PixelIcon";

describe("PIXEL_ICONS", () => {
  it("draws every icon on a full 10×10 grid of known pixels", () => {
    for (const [name, art] of Object.entries(PIXEL_ICONS)) {
      const palette: Record<string, string> = "palette" in art ? (art.palette as Record<string, string>) : {};
      expect(art.rows, name).toHaveLength(10);
      for (const row of art.rows) {
        expect(row, name).toHaveLength(10);
        expect([...row].every((c) => c === "." || c === "#" || c in palette), name).toBe(true);
      }
    }
  });
});
