import { describe, expect, it } from "vitest";
import { testQuestions } from "./mock/questions";
import { classOverviewFrom, heatmapFrom, progressFrom, scoreTest } from "./scoring";

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

describe("class results", () => {
  const first = testQuestions[0];
  const good = progressFrom(scoreTest(allRight));
  const weakFirst = progressFrom(scoreTest({ ...allRight, [first.id]: first.correctIndex + 1 }));
  // №01 all right, №02 weak in the first question's subtopic, №03 hasn't taken the test.
  const students = [good, weakFirst, undefined];

  it("counts tested students and finds the weakest subtopic", () => {
    expect(classOverviewFrom("7А-1", "fractions", students)).toMatchObject({
      code: "7А-1",
      studentCount: 3,
      testedCount: 2,
      weakestSubtopicId: first.subtopicId,
      weakestCount: 1,
    });
  });

  it("has no weakest subtopic when nobody is weak or nobody took the test", () => {
    expect(classOverviewFrom("7А-1", "fractions", [good])).toMatchObject({ weakestSubtopicId: "", weakestCount: 0 });
    expect(classOverviewFrom("", "fractions", [])).toMatchObject({ studentCount: 0, testedCount: 0 });
  });

  it("gives one cell per student by number", () => {
    const row = heatmapFrom("fractions", students).find((r) => r.subtopicId === first.subtopicId)!;
    expect(row.cells).toEqual(["good", "weak", "untested"]);
  });
});
