import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { BATTLE_SUBJECTS, battleQuestionPool, findBattleQuestion } = await import("./battle-questions");
const { bosses } = await import("./mock/bosses");
const { gameSubjects } = await import("./mock/games");

const boss = bosses[0];

describe("battle questions", () => {
  it("has questions for every subject", () => {
    for (const s of BATTLE_SUBJECTS) expect(battleQuestionPool(boss, s.id).length, s.id).toBeGreaterThan(0);
  });

  it("asks only the chosen subject", () => {
    expect(battleQuestionPool(boss, "hist").every((q) => q.unitId === "hist")).toBe(true);
    expect(battleQuestionPool(boss, "eng").every((q) => q.skill !== "subject")).toBe(true);
  });

  it("turns game questions into four options with the right one marked", () => {
    const source = gameSubjects.find((s) => s.id === "math")!.questions[0];
    const q = findBattleQuestion(`math:${source.id}`);
    expect(q?.kind).toBe("choice");
    if (q?.kind !== "choice") return;
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options[q.correctIndex]).toBe(source.correct[0]);
    // The same options every time, so the answer index stays valid.
    expect(findBattleQuestion(q.id)).toBe(q);
  });

  it("never shows the same option twice", () => {
    for (const s of BATTLE_SUBJECTS.filter((x) => x.id !== "eng")) {
      for (const q of battleQuestionPool(boss, s.id)) {
        if (q.kind === "choice") expect(new Set(q.options).size, q.id).toBe(q.options.length);
      }
    }
  });

  it("falls back to English for an unknown subject", () => {
    expect(battleQuestionPool(boss, "nope")).toEqual(battleQuestionPool(boss, "eng"));
  });
});
