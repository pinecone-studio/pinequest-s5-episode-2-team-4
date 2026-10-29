import { describe, expect, it } from "vitest";
import { share } from "./class-results";

describe("share", () => {
  it("rounds to a whole percent", () => {
    expect(share(1, 3)).toBe(33);
    expect(share(2, 3)).toBe(67);
  });

  it("is 0 instead of dividing by zero", () => {
    expect(share(0, 0)).toBe(0);
  });
});
