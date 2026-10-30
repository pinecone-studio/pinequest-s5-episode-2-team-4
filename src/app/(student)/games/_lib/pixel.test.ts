import { describe, expect, it } from "vitest";
import { snap } from "./pixel";

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
