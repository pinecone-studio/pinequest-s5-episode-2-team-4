import { describe, expect, it } from "vitest";
import { recordMistake, mistakeKey } from "./mistake-records";

describe("mistake records", () => {
  it("does not collect a first correct answer", () => {
    expect(recordMistake(undefined, "math", "q1", 1, true)).toEqual({});
  });
  it("collects and deduplicates wrong answers without mutating previous state", () => {
    const first = recordMistake(undefined, "math", "q1", 0, false);
    const next = recordMistake(first, "math", "q1", 2, false);
    expect(Object.keys(next)).toHaveLength(1);
    expect(next["math:q1"].answer).toBe(2);
    expect(first["math:q1"].answer).toBe(0);
  });
  it("resolves a mistake while preserving the wrong answer for reference", () => {
    const first = recordMistake(undefined, "math", "q1", 0, false);
    expect(recordMistake(first, "math", "q1", 1, true)["math:q1"]).toMatchObject({ answer: 0, resolved: true });
  });
  it("reopens a previously resolved question after a new wrong answer", () => {
    const first = recordMistake(undefined, "math", "q1", 0, false);
    const resolved = recordMistake(first, "math", "q1", 1, true);
    expect(recordMistake(resolved, "math", "q1", 3, false)["math:q1"]).toMatchObject({ answer: 3, resolved: false });
  });
  it("keeps sources separate even when question ids match", () => {
    const first = recordMistake(undefined, "math", "q1", 0, false);
    const next = recordMistake(first, "battle", "q1", "wrong", false);
    expect(Object.keys(next)).toHaveLength(2);
    expect(next[mistakeKey("battle", "q1")].answer).toBe("wrong");
  });
});
