import { describe, expect, it } from "vitest";
import { darken, lighten, mix } from "./color";

describe("mix", () => {
  it("goes from one colour to the other", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("darken and lighten", () => {
  it("step towards black and white", () => {
    expect(darken("#e30ba6", 0.5)).toBe("#720653");
    expect(lighten("#e30ba6", 0.5)).toBe("#f185d3");
  });

  it("keep the colour at 0", () => {
    expect(darken("#34d399", 0)).toBe("#34d399");
    expect(lighten("#34d399", 0)).toBe("#34d399");
  });
});
