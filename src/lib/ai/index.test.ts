import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const classify = vi.hoisted(() => vi.fn());
vi.mock("./claude", () => ({ claudeClassifier: { classify } }));

const { classifyQuestion } = await import("./index");

const input = { text: "маргааш амралт уу", lessonTitle: "Хураах", groups: [] };

beforeEach(() => {
  classify.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("classifyQuestion", () => {
  it("uses the rules when there is no API key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await classifyQuestion(input)).toMatchObject({ source: "rules" });
    expect(classify).not.toHaveBeenCalled();
  });

  it("uses Claude when there is a key", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    classify.mockResolvedValue({ groupId: null, title: "Хураах: амралт", source: "ai" });
    expect(await classifyQuestion(input)).toMatchObject({ source: "ai" });
  });

  it("falls back to the rules when Claude times out", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    classify.mockRejectedValue(new Error("Request timed out."));
    expect(await classifyQuestion(input)).toMatchObject({ source: "rules", title: "Хураах: маргааш амралт уу" });
  });

  it("falls back to the rules when Claude's reply is invalid", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    classify.mockRejectedValue(new Error("Classifier picked an unknown group: g9"));
    expect(await classifyQuestion(input)).toMatchObject({ source: "rules" });
  });
});
