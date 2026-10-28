import { describe, expect, it } from "vitest";
import { MAX_QUESTION_LENGTH, cleanQuestion, normalizeQuestion } from "./question-text";

describe("normalizeQuestion", () => {
  it("ignores case, punctuation and extra spaces", () => {
    expect(normalizeQuestion("  Яаж   ХУРААХ вэ?!  ")).toBe("яаж хураах вэ");
  });

  it("keeps fractions and math signs", () => {
    expect(normalizeQuestion("1/2 + 1/3 = 2/5 зөв үү?")).toBe("1/2 + 1/3 = 2/5 зөв үү");
  });

  it("treats the same Cyrillic letters typed two ways as one", () => {
    // "й" as one character and as "и" plus a combining breve.
    expect(normalizeQuestion("яагаад нэмдэггүй")).toBe(normalizeQuestion("яагаад нэмдэггүй"));
  });

  it("keeps Latin and mixed spelling as typed", () => {
    expect(normalizeQuestion("Huvaariig YGD nemdeggui ym?")).toBe("huvaariig ygd nemdeggui ym");
    expect(normalizeQuestion("6/8-iig яаж huraah вэ")).toBe("6/8-iig яаж huraah вэ");
  });

  it("matches a repeated question with different punctuation", () => {
    expect(normalizeQuestion("6/8-ийг яаж хураах вэ")).toBe(normalizeQuestion("6/8-ийг яаж хураах вэ???"));
  });
});

describe("cleanQuestion", () => {
  it("trims and collapses spaces but keeps the student's words", () => {
    expect(cleanQuestion("  Яаж\n\nхураах   вэ? ")).toBe("Яаж хураах вэ?");
  });

  it("rejects a question with no letters or numbers", () => {
    expect(cleanQuestion("   ?!...  ")).toBeNull();
    expect(cleanQuestion("")).toBeNull();
  });

  it("cuts very long questions", () => {
    expect(cleanQuestion("а".repeat(MAX_QUESTION_LENGTH + 50))).toHaveLength(MAX_QUESTION_LENGTH);
  });
});
