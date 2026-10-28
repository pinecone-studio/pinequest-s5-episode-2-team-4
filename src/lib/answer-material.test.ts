import { describe, expect, it } from "vitest";
import { materialHref, materialLabel, parseMaterial } from "./answer-material";

describe("parseMaterial", () => {
  it("accepts a part of a known lesson", () => {
    expect(parseMaterial({ kind: "lesson", subtopicId: "simplify", part: "practice" })).toEqual({
      kind: "lesson",
      subtopicId: "simplify",
      part: "practice",
    });
  });

  it("rejects an unknown lesson or part", () => {
    expect(parseMaterial({ kind: "lesson", subtopicId: "nope", part: "practice" })).toBeNull();
    expect(parseMaterial({ kind: "lesson", subtopicId: "simplify", part: "quiz" })).toBeNull();
  });

  it("accepts an http(s) link and falls back to its site name", () => {
    expect(parseMaterial({ kind: "link", url: " https://www.youtube.com/watch?v=abc ", title: "" })).toEqual({
      kind: "link",
      url: "https://www.youtube.com/watch?v=abc",
      title: "www.youtube.com",
    });
  });

  it("rejects links that are not web pages", () => {
    expect(parseMaterial({ kind: "link", url: "javascript:alert(1)", title: "x" })).toBeNull();
    expect(parseMaterial({ kind: "link", url: "not a url", title: "x" })).toBeNull();
  });

  it("rejects anything else", () => {
    expect(parseMaterial(undefined)).toBeNull();
    expect(parseMaterial({ kind: "file" })).toBeNull();
  });
});

describe("materialHref and materialLabel", () => {
  it("point a lesson part at its section", () => {
    const m = { kind: "lesson", subtopicId: "simplify", part: "practice" } as const;
    expect(materialHref(m)).toBe("/lesson/fractions?sub=simplify#practice-title");
    expect(materialLabel(m)).toBe("Хураах · Дасгал");
  });
});
