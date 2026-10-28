import { describe, expect, it } from "vitest";
import { checkFormula, evaluateExpression, formatRational, promptValue, sameAnswer } from "./formula";

const value = (text: string) => {
  const v = evaluateExpression(text);
  return v && formatRational(v);
};

describe("evaluateExpression", () => {
  it("adds fractions exactly", () => {
    expect(value("1/2 + 1/3")).toBe("5/6");
  });

  it("reads mixed numbers, unicode signs and decimals", () => {
    expect(value("2 1/3")).toBe("7/3");
    expect(value("3/4 − 1/2")).toBe("1/4");
    expect(value("2/3 × 3/4")).toBe("1/2");
    expect(value("1 ÷ 4")).toBe("1/4");
    // A fraction is one number next to ÷, ×, :
    expect(value("1/2 ÷ 1/4")).toBe("2");
    expect(value("2/3 : 4/5")).toBe("5/6");
    expect(value("3/4 × 2/3")).toBe("1/2");
    expect(value("6 ÷ 2/3")).toBe("9");
    expect(value("0,5 + 0.25")).toBe("3/4");
  });

  it("follows precedence, parentheses, powers and unary minus", () => {
    expect(value("2 + 3 * 4")).toBe("14");
    expect(value("(2 + 3) * 4")).toBe("20");
    expect(value("2^3 - -1")).toBe("9");
  });

  it("gives up on words, letters and division by zero", () => {
    expect(evaluateExpression("x + 1")).toBeUndefined();
    expect(evaluateExpression("1/0")).toBeUndefined();
    expect(evaluateExpression("?")).toBeUndefined();
  });
});

describe("checkFormula", () => {
  it("accepts a true equation", () => {
    expect(checkFormula("1/2 + 1/3 = 5/6")).toEqual({ status: "ok" });
    expect(checkFormula("6/8 = 3/4")).toEqual({ status: "ok" });
  });

  it("flags the classic fraction mistake with the right answer", () => {
    expect(checkFormula("1/2 + 1/3 = 2/5")).toEqual({ status: "wrong", expected: "5/6" });
  });

  it("leaves what it can't compute to the teacher", () => {
    expect(checkFormula("a/b + c/d = (ad + bc)/bd")).toEqual({ status: "unknown" });
    expect(checkFormula("1/2 + 1/3")).toEqual({ status: "unknown" });
  });
});

describe("answers", () => {
  it("compares equal fractions", () => {
    expect(sameAnswer("6/8", "3/4")).toBe(true);
    expect(sameAnswer("1 1/2", "3/2")).toBe(true);
    expect(sameAnswer("2/5", "3/4")).toBe(false);
    expect(sameAnswer(" Хойд ", "хойд")).toBe(true);
  });

  it("finds the value a prompt asks for", () => {
    expect(formatRational(promptValue("1/2 + 1/4 = ?")!)).toBe("3/4");
    expect(promptValue("Бат номынхоо 1/2-ийг уншсан. Хэд үлдсэн бэ?")).toBeUndefined();
  });
});
