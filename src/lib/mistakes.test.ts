import { beforeEach, describe, expect, it, vi } from "vitest";
import { testQuestions } from "./mock/questions";
import { englishQuestions } from "./mock/english";
import { notebookItem, checkNotebookAnswer, notebookRecords } from "./mistakes";
import type { Session } from "./session";

const englishProgress = vi.hoisted(() => vi.fn());
vi.mock("./progress", () => ({ englishProgress }));
const session: Session = { id: "student-1", username: "Test", role: "student" };
beforeEach(() => englishProgress.mockResolvedValue({ mistakes: [] }));

describe("notebook", () => {
  it("seeds old diagnostic errors but excludes correct/unanswered questions", async () => {
    const q = testQuestions[0];
    const records = await notebookRecords({ ...session, testAnswers: { [q.id]: (q.correctIndex + 1) % q.options.length } });
    expect(Object.keys(records)).toEqual([`math:${q.id}`]);
    expect(await notebookRecords({ ...session, testAnswers: { [q.id]: q.correctIndex } })).toEqual({});
  });
  it("does not reopen an old test or English mistake after notebook review", async () => {
    const english = englishQuestions[0];
    englishProgress.mockResolvedValue({ mistakes: [{ questionId: english.id }] });
    const records = await notebookRecords({ ...session, mistakes: { [`battle:${english.id}`]: { source: "battle", questionId: english.id, resolved: true } } });
    expect(records[`battle:${english.id}`].resolved).toBe(true);
    expect(englishProgress).toHaveBeenCalledWith(expect.anything(), Infinity);
  });
  it("imports all existing English mistakes without the old five-item limit", async () => {
    englishProgress.mockResolvedValue({ mistakes: englishQuestions.slice(0, 9).map((q) => ({ questionId: q.id })) });
    expect(Object.keys(await notebookRecords(session))).toHaveLength(9);
  });
  it("checks math answers on the server and rejects invalid indices", () => {
    const q = testQuestions[0];
    const record = { source: "math" as const, questionId: q.id, resolved: false };
    expect(checkNotebookAnswer(record, q.correctIndex)).toBe(true);
    for (const answer of [-1, 500, 1.5, "1"]) expect(checkNotebookAnswer(record, answer)).toBeUndefined();
    const item = notebookItem(record)!;
    expect(item.expected).toBe(item.options![q.correctIndex]);
    expect(item.explanation).toBeTruthy();
  });
  it("normalizes typed English answers and handles missing questions", () => {
    const q = englishQuestions.find((q) => q.kind !== "choice")!;
    expect(checkNotebookAnswer({ source: "battle", questionId: q.id, resolved: false }, `  ${q.acceptedAnswers[0].toUpperCase()}  `)).toBe(true);
    expect(notebookItem({ source: "math", questionId: "missing", resolved: false })).toBeUndefined();
  });
});
