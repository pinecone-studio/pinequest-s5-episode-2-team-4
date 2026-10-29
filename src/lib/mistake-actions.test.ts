import { beforeEach, describe, expect, it, vi } from "vitest";
import { testQuestions } from "./mock/questions";

const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), progress: vi.fn(), revalidate: vi.fn() }));
vi.mock("./session", () => ({ readSession: mocks.read, writeSession: mocks.write }));
vi.mock("./progress", () => ({ englishProgress: mocks.progress }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { reviewMistake } from "./mistake-actions";
const q = testQuestions[0];
const key = `math:${q.id}`;
const session = { id: "student-1", username: "Test", role: "student", mistakes: { [key]: { source: "math", questionId: q.id, answer: (q.correctIndex + 1) % q.options.length, resolved: false } } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue(session);
  mocks.progress.mockResolvedValue({ mistakes: [] });
  mocks.write.mockResolvedValue(undefined);
});

describe("review action", () => {
  it("requires student authentication", async () => {
    mocks.read.mockResolvedValue(undefined);
    await expect(reviewMistake(key, 0)).rejects.toThrow("redirect:/login");
    mocks.read.mockResolvedValue({ ...session, role: "teacher" });
    await expect(reviewMistake(key, 0)).rejects.toThrow("redirect:/teacher");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("rejects questions outside the user's notebook and inherited keys", async () => {
    expect(await reviewMistake("math:q999", 0)).toHaveProperty("error");
    expect(await reviewMistake("toString", 0)).toHaveProperty("error");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("rejects invalid answers without changing progress", async () => {
    expect(await reviewMistake(key, -1)).toHaveProperty("error");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("saves a correct review and learning day without granting XP", async () => {
    expect(await reviewMistake(key, q.correctIndex)).toMatchObject({ correct: true });
    expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({
      mistakes: expect.objectContaining({ [key]: expect.objectContaining({ resolved: true }) }),
      streak: expect.objectContaining({ current: 1 }),
    }));
    expect(mocks.revalidate).toHaveBeenCalledWith("/mistakes");
    expect(mocks.write.mock.calls[0][0].pet).toBeUndefined();
  });
  it("keeps a wrong review pending", async () => {
    expect(await reviewMistake(key, (q.correctIndex + 1) % q.options.length)).toMatchObject({ correct: false });
    expect(mocks.write.mock.calls[0][0].mistakes[key].resolved).toBe(false);
  });
});
