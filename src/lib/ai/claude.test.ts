import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake Anthropic client: each test sets what `messages.parse` returns.
const parse = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));

const { claudeClassifier } = await import("./claude");

const input = {
  text: "huvaariig ygd nemdeggui ym",
  lessonTitle: "Ижил хуваарь",
  groups: [
    { id: "uuid-1", title: "Ижил хуваарь: хариуг яаж шалгах вэ", examples: [] },
    { id: "uuid-2", title: "Ижил хуваарь: хуваарийг яагаад нэмдэггүй вэ", examples: ["хуваарийг нь яагаад нэмэхгүй байгаа юм"] },
  ],
};

const reply = (parsed: object | null, stop = "end_turn") => ({
  parsed_output: parsed,
  stop_reason: stop,
  usage: { input_tokens: 1000, output_tokens: 50 },
});

const answer = { group: null, title: "Ижил хуваарь: шинэ асуулт", intent: "why", misconception: null, needs_review: false };

beforeEach(() => {
  parse.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("claudeClassifier", () => {
  it("maps g1, g2, … back to the real group ids", async () => {
    parse.mockResolvedValue(reply({ ...answer, group: "g2" }));
    expect(await claudeClassifier.classify(input)).toMatchObject({ groupId: "uuid-2", intent: "why", source: "ai" });
  });

  it("sends only the question, lesson and group titles", async () => {
    parse.mockResolvedValue(reply(answer));
    await claudeClassifier.classify(input);
    const { messages } = parse.mock.calls[0][0];
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toContain("huvaariig ygd nemdeggui ym");
    expect(messages[0].content).toContain("g2: Ижил хуваарь: хуваарийг яагаад нэмдэггүй вэ");
    expect(messages[0].content).not.toContain("uuid-");
  });

  it("starts a new group with the title it suggests", async () => {
    parse.mockResolvedValue(reply({ ...answer, misconception: "  ", needs_review: true }));
    expect(await claudeClassifier.classify(input)).toMatchObject({
      groupId: null,
      title: "Ижил хуваарь: шинэ асуулт",
      misconception: null,
      needsReview: true,
    });
  });

  it("rejects a group that does not exist", async () => {
    parse.mockResolvedValue(reply({ ...answer, group: "g7" }));
    await expect(claudeClassifier.classify(input)).rejects.toThrow("unknown group");
  });

  it("rejects a reply that did not match the schema", async () => {
    parse.mockResolvedValue(reply(null, "max_tokens"));
    await expect(claudeClassifier.classify(input)).rejects.toThrow("no valid reply");
  });

  it("rejects a new group with an empty title", async () => {
    parse.mockResolvedValue(reply({ ...answer, title: "   " }));
    await expect(claudeClassifier.classify(input)).rejects.toThrow("empty title");
  });
});
