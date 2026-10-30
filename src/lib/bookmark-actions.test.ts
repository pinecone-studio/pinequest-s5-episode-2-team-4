import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn(), video: vi.fn(), revalidate: vi.fn() }));
vi.mock("./session", () => ({ readSession: mocks.read, writeSession: mocks.write }));
vi.mock("./data", () => ({ getClassVideo: mocks.video }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { setVideoBookmark } from "./bookmark-actions";

const id = "11111111-1111-4111-8111-111111111111";
const session = { id: "student", role: "student", username: "Test", videosSeen: [id], quests: { day: "2026-10-29", counts: { video: 1 }, claimed: [] } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue(session);
  mocks.video.mockResolvedValue({ id });
  mocks.write.mockResolvedValue(undefined);
});

describe("lesson bookmarks", () => {
  it("saves an accessible video and preserves seen/quest progress", async () => {
    expect(await setVideoBookmark(id, true)).toEqual({ saved: true });
    expect(mocks.write).toHaveBeenCalledWith({ ...session, bookmarkedVideos: [id] });
    expect(mocks.revalidate).toHaveBeenCalledWith("/videos");
    expect(mocks.revalidate).toHaveBeenCalledWith(`/videos/${id}`);
  });
  it("does not duplicate saved ids or write on repeated requests", async () => {
    mocks.read.mockResolvedValue({ ...session, bookmarkedVideos: [id] });
    expect(await setVideoBookmark(id, true)).toEqual({ saved: true });
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("allows removing an old saved video after access is lost", async () => {
    mocks.read.mockResolvedValue({ ...session, bookmarkedVideos: [id] });
    mocks.video.mockResolvedValue(undefined);
    expect(await setVideoBookmark(id, false)).toEqual({ saved: false });
    expect(mocks.write).toHaveBeenCalledWith({ ...session, bookmarkedVideos: [] });
    expect(mocks.video).not.toHaveBeenCalled();
  });
  it("rejects videos not published to the student's class", async () => {
    mocks.video.mockResolvedValue(undefined);
    expect(await setVideoBookmark(id, true)).toHaveProperty("error");
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("rejects anonymous users and teachers", async () => {
    for (const value of [undefined, { ...session, role: "teacher" }]) {
      mocks.read.mockResolvedValue(value);
      expect(await setVideoBookmark(id, true)).toHaveProperty("error");
    }
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.video).not.toHaveBeenCalled();
  });
  it("validates ids and desired state before accessing content", async () => {
    expect(await setVideoBookmark("invalid", true)).toHaveProperty("error");
    expect(await setVideoBookmark(id, "true" as unknown as boolean)).toHaveProperty("error");
    expect(mocks.video).not.toHaveBeenCalled();
    expect(mocks.write).not.toHaveBeenCalled();
  });
});
