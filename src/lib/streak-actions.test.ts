import { beforeEach, describe, expect, it, vi } from "vitest";
import { learningDay, recordLearningDay, shiftDay } from "./streak";

const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("./session", () => ({ readSession: mocks.read, writeSession: mocks.write }));
import { recordSiteActivity } from "./streak-actions";
const session = { id: "student-1", username: "Test", role: "student", pet: { lineId: "wrougon", level: 1, xp: 0 } };
beforeEach(() => { vi.clearAllMocks(); mocks.write.mockResolvedValue(undefined); });

describe("automatic site activity", () => {
  it("records a visit without requiring a test or an answer", async () => {
    mocks.read.mockResolvedValue(session);
    expect(await recordSiteActivity()).toEqual({ date: learningDay() });
    expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({ pet: session.pet, streak: expect.objectContaining({ current: 1 }) }));
  });
  it("does not write or increment twice on the same day", async () => {
    const streak = recordLearningDay(undefined);
    mocks.read.mockResolvedValue({ ...session, streak });
    expect(await recordSiteActivity()).toEqual({ date: streak.lastDate });
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("continues yesterday's streak and retains all unrelated progress", async () => {
    const streak = recordLearningDay(undefined, shiftDay(learningDay(), -1));
    mocks.read.mockResolvedValue({ ...session, streak, practiceSolved: ["p1"] });
    await recordSiteActivity();
    expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({ practiceSolved: ["p1"], streak: expect.objectContaining({ current: 2, lastDate: learningDay() }) }));
  });
  it("restarts after a missed day", async () => {
    const streak = recordLearningDay(undefined, shiftDay(learningDay(), -3));
    mocks.read.mockResolvedValue({ ...session, streak });
    await recordSiteActivity();
    expect(mocks.write.mock.calls[0][0].streak.current).toBe(1);
  });
  it("never writes for logged-out users or teachers", async () => {
    for (const value of [undefined, { ...session, role: "teacher" }]) {
      mocks.read.mockResolvedValue(value);
      expect(await recordSiteActivity()).toBeUndefined();
    }
    expect(mocks.write).not.toHaveBeenCalled();
  });
});
