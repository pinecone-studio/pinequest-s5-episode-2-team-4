import { describe, expect, it } from "vitest";
import { testQuestions } from "./mock/questions";
import { progressFrom, scoreTest } from "./scoring";

const allRight = Object.fromEntries(testQuestions.map((q) => [q.id, q.correctIndex]));

describe("scoreTest", () => {
  it("is undefined until the test is taken", () => {
    expect(scoreTest(undefined)).toBeUndefined();
    expect(scoreTest({})).toBeUndefined();
  });

  it("counts every answer and marks fully right subtopics good", () => {
    const result = scoreTest(allRight)!;
    expect(result.correct).toBe(result.total);
    expect(result.subtopics.every((s) => s.status === "good")).toBe(true);
  });

  it("puts the weakest subtopic first", () => {
    const first = testQuestions[0];
    const result = scoreTest({ ...allRight, [first.id]: first.correctIndex + 1 })!;
    expect(result.subtopics[0]).toMatchObject({ subtopicId: first.subtopicId, status: "weak" });
  });
});

describe("progressFrom", () => {
  it("marks retest-passed subtopics mastered", () => {
    const result = scoreTest(allRight)!;
    const id = result.subtopics[0].subtopicId;
    expect(progressFrom(result, [id]).find((p) => p.subtopicId === id)?.status).toBe("mastered");
    expect(progressFrom(undefined)).toEqual([]);
  });
});
