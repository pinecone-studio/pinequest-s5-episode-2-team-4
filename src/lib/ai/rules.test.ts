import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH } from "./classifier";
import { rulesClassifier, similarity } from "./rules";

const groups = [
  { id: "simplify", title: "Хураах: 6/8-ийг яаж хураах вэ", examples: ["хураахдаа ямар тоогоор хуваах вэ"] },
  { id: "denominator", title: "Ижил хуваарь: хуваарийг яагаад нэмдэггүй вэ", examples: [] },
];

describe("similarity", () => {
  it("is 1 for the same words in any case or punctuation", () => {
    expect(similarity("Яаж хураах вэ?", "яаж ХУРААХ вэ")).toBe(1);
  });

  it("is 0 when no words are shared", () => {
    expect(similarity("маргааш амралт уу", "хуваарийг нэмэх")).toBe(0);
  });

  it("is 0 for an empty question", () => {
    expect(similarity("?", "яаж хураах вэ")).toBe(0);
  });
});

describe("rulesClassifier", () => {
  it("joins the group whose examples share most words", async () => {
    const result = await rulesClassifier.classify({
      text: "Хураахдаа ямар тоогоор хуваах вэ?",
      lessonTitle: "Хураах",
      groups,
    });
    expect(result).toMatchObject({ groupId: "simplify", source: "rules" });
  });

  it("starts a new group titled by the lesson when nothing is similar", async () => {
    const result = await rulesClassifier.classify({ text: "маргааш амралт уу", lessonTitle: "Хураах", groups });
    expect(result.groupId).toBeNull();
    expect(result.title).toBe("Хураах: маргааш амралт уу");
  });

  it("does not match Latin spelling to Cyrillic (the AI does)", async () => {
    const result = await rulesClassifier.classify({
      text: "huvaariig ygd nemdeggui ym",
      lessonTitle: "Ижил хуваарь",
      groups,
    });
    expect(result.groupId).toBeNull();
  });

  it("keeps new titles within the database limit", async () => {
    const result = await rulesClassifier.classify({ text: "а ".repeat(200), lessonTitle: "Хураах", groups: [] });
    expect(result.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it("never flags a question for review", async () => {
    const result = await rulesClassifier.classify({ text: "маргааш амралт уу", lessonTitle: "Хураах", groups: [] });
    expect(result).toMatchObject({ intent: "other", misconception: null, needsReview: false });
  });
});
