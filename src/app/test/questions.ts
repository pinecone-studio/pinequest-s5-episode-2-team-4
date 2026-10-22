// TODO(#8): move these types to src/lib/types.ts and the data to src/lib/mock/,
// then read them through getQuestions().

export type FractionValue = {
  numerator: number;
  denominator: number;
  whole?: number;
};

export type ExpressionPart =
  | { kind: "fraction"; value: FractionValue }
  | { kind: "operator"; symbol: "+" | "=" }
  | { kind: "blank" };

export type TestQuestion = {
  id: string;
  subtopic: string;
  prompt: string;
  expression: ExpressionPart[];
  options: FractionValue[];
  correctIndex: number;
};

const f = (numerator: number, denominator: number, whole?: number) => ({
  numerator,
  denominator,
  whole,
});

const frac = (
  numerator: number,
  denominator: number,
  whole?: number,
): ExpressionPart => ({ kind: "fraction", value: f(numerator, denominator, whole) });

const plus: ExpressionPart = { kind: "operator", symbol: "+" };
const equals: ExpressionPart = { kind: "operator", symbol: "=" };
const blank: ExpressionPart = { kind: "blank" };

const QUESTIONS: TestQuestion[] = [
  {
    id: "q1",
    subtopic: "same-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(2, 7), plus, frac(3, 7), equals, blank],
    options: [f(5, 14), f(5, 7), f(6, 7), f(1, 7)],
    correctIndex: 1,
  },
  {
    id: "q2",
    subtopic: "same-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(5, 9), plus, frac(2, 9), equals, blank],
    options: [f(7, 18), f(3, 9), f(7, 9), f(10, 9)],
    correctIndex: 2,
  },
  {
    id: "q3",
    subtopic: "different-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(1, 2), plus, frac(1, 3), equals, blank],
    options: [f(2, 5), f(2, 6), f(5, 6), f(1, 6)],
    correctIndex: 2,
  },
  {
    id: "q4",
    subtopic: "different-denominator",
    prompt: "Нийлбэрийг ол",
    expression: [frac(1, 4), plus, frac(2, 3), equals, blank],
    options: [f(11, 12), f(3, 7), f(3, 12), f(8, 12)],
    correctIndex: 0,
  },
  {
    id: "q5",
    subtopic: "simplify",
    prompt: "Хураа",
    expression: [frac(6, 8), equals, blank],
    options: [f(6, 4), f(3, 8), f(2, 3), f(3, 4)],
    correctIndex: 3,
  },
  {
    id: "q6",
    subtopic: "simplify",
    prompt: "Хураа",
    expression: [frac(10, 15), equals, blank],
    options: [f(1, 3), f(2, 5), f(2, 3), f(5, 3)],
    correctIndex: 2,
  },
  {
    id: "q7",
    subtopic: "mixed-numbers",
    prompt: "Зөв биш бутархай болго",
    expression: [frac(1, 3, 2), equals, blank],
    options: [f(5, 3), f(7, 3), f(6, 3), f(2, 3)],
    correctIndex: 1,
  },
  {
    id: "q8",
    subtopic: "mixed-numbers",
    prompt: "Холимог тоо болго",
    expression: [frac(11, 4), equals, blank],
    options: [f(1, 4, 3), f(3, 4, 1), f(1, 4, 2), f(3, 4, 2)],
    correctIndex: 3,
  },
];

export function getTestQuestions(): TestQuestion[] {
  return QUESTIONS;
}
